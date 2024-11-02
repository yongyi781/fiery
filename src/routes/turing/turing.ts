export const tmStateColors = [
  [255, 142, 185, 255],
  [243, 176, 29, 255],
  [101, 195, 255, 255],
  [131, 214, 112, 255],
  [221, 159, 255, 255],
  [0, 222, 194, 255],
  [197, 198, 50, 255],
  [255, 255, 255, 255],
  [255, 0, 0, 255] // Solid red for halt
]

export const maxSymbolColor = 180

export function getTmSymbolColor(x: number, nSymbols: number) {
  return (x / (nSymbols - 1)) * maxSymbolColor
}

export function getTmStateColor(state: number) {
  if (state < 0 || state >= tmStateColors.length) {
    return tmStateColors[tmStateColors.length - 1]
  }
  return tmStateColors[state]
}

export function getTmStateColorCss(state: number) {
  const res = getTmStateColor(state)
  return `rgb(${res[0]}, ${res[1]}, ${res[2]})`
}

export type Transition = {
  symbol: number
  direction: -1 | 1
  toState: number
}

export function stateToString(state: number) {
  return state === -1 ? "-" : String.fromCharCode(state + 65)
}

export type TapeSegment = {
  data: Uint8Array
  head: number
  state: number
}

/** A Turing tape, along with a head and a state. */
export class Tape {
  data = new Uint8Array(1)
  head = 0
  state = 0
  offset = 0
  leftEdge = 0
  rightEdge = 0

  constructor(t: Partial<Tape> = {}) {
    Object.assign(this, t)
    if (t.data != null) this.data = this.data.slice()
  }

  static parse(s: string) {
    const t = new Tape()
    if (s.length === 0) return t
    t.state = s.charCodeAt(0) - 65
    if (t.state < 0 || t.state >= 26) return
    if (s.length === 1) return t
    t.data = new Uint8Array(s.length - 1)
    let di = 0
    let foundCaret = false
    for (let i = 1; i < s.length; i++) {
      if (s[i] === ">" && !foundCaret) {
        foundCaret = true
        t.offset = i - 1
      } else if (s.charCodeAt(i) >= 48 && s.charCodeAt(i) < 57) t.data[di++] = s.charCodeAt(i) - 48
      else return
    }
    t.leftEdge = -t.offset
    t.rightEdge = di - 1 - t.offset
    return t
  }

  get value() {
    return this.at(this.head)
  }

  get size() {
    return this.rightEdge - this.leftEdge + 1
  }

  at(i: number) {
    return this.data[i + this.offset] ?? 0
  }

  write(value: number) {
    this.data[this.head + this.offset] = value
  }

  step(tr: Transition) {
    this.write(tr.symbol)
    this.head += tr.direction
    this.state = tr.toState
    if (this.head < this.leftEdge) --this.leftEdge
    if (this.head > this.rightEdge) ++this.rightEdge
    if (this.head + this.offset < 0) {
      const len = this.data.length
      const copy = this.data
      this.data = new Uint8Array(len + copy.length)
      this.data.set(copy, len)
      this.offset += len
    } else if (this.head + this.offset >= this.data.length) {
      const len = this.data.length
      const copy = this.data
      this.data = new Uint8Array(len + copy.length)
      this.data.set(copy)
    }
  }

  getSegment(start: number, end: number): TapeSegment {
    const data = new Uint8Array(end - start + 1)
    for (let i = start; i <= end; ++i) data[i - start] = this.at(i)
    return { data, head: this.head - start, state: this.state }
  }

  /** Returns the tape in the format [state]xxxx>xxxx. */
  toString() {
    return (
      stateToString(this.state) +
      this.data.slice(this.leftEdge + this.offset, this.head + this.offset).join("") +
      ">" +
      this.data.slice(this.head + this.offset, this.rightEdge + this.offset + 1).join("")
    )
  }
}

export type TMRule = Transition[][]

export function rulesEqual(a: TMRule, b: TMRule) {
  return formatTMRule(a) === formatTMRule(b)
}

export function parseTMRule(s: string) {
  s = s.trim().toUpperCase()
  if (s.length === 0) return []
  const rule: TMRule = []
  const lines = s.split("_")
  if (!lines.every((line) => line.length % 3 === 0 && line.length === lines[0].length)) return []
  const nSymbols = lines[0].length / 3
  for (const line of s.split("_")) {
    const tr: Transition[] = []
    for (let i = 0; i < line.length; i += 3) {
      if (line[i + 2] === "-")
        tr.push({
          symbol: 1,
          direction: 1,
          toState: -1
        })
      else {
        const symbol = line.charCodeAt(i) - "0".charCodeAt(0)
        if (symbol < 0 || symbol >= nSymbols) return []
        if (line[i + 1] !== "R" && line[i + 1] !== "L") return []

        tr.push({
          symbol,
          direction: line[i + 1] === "L" ? -1 : 1,
          toState: line.charCodeAt(i + 2) - 65
        })
      }
    }
    rule.push(tr)
  }
  return rule
}

export function formatTMRule(rule: TMRule) {
  return rule
    .map((row) =>
      row
        .map((tr) => {
          if (tr.toState === -1) return "---"
          const symbol = String.fromCharCode(tr.symbol + 48)
          const direction = tr.direction === -1 ? "L" : "R"
          const toState = stateToString(tr.toState)
          return `${symbol}${direction}${toState}`
        })
        .join("")
    )
    .join("_")
}

export type MacroTransition = {
  from: TapeSegment
  to: TapeSegment
  steps: number
}

export interface TuringMachineInfo {
  rule: TMRule
  tape?: Tape
  snapshots?: Tape[]
  snapshotFrequency?: number
}

export class TuringMachine {
  rule: TMRule = []
  tape = new Tape()
  steps = 0
  snapshots: Tape[] = []
  snapshotFrequency = 1 << 16

  constructor(machine: Partial<TuringMachine> = {}) {
    Object.assign(this, machine)
    if (machine.rule != null) this.rule = this.rule.map((row) => row.map((tr) => ({ ...tr })))
    if (machine.tape != null) this.tape = new Tape(this.tape)
    if (machine.snapshots != null) this.snapshots = machine.snapshots.map((tape) => new Tape(tape))
    else this.snapshots = [new Tape(this.tape)]
  }

  get halted() {
    return this.tape.state < 0 || this.tape.state >= this.rule.length
  }

  get initialTape() {
    return this.snapshots[0]
  }

  get head() {
    return this.tape.head
  }

  get state() {
    return this.tape.state
  }

  peek() {
    return this.rule[this.tape.state]?.[this.tape.value]
  }

  step() {
    const tr = this.peek()
    if (!tr) return false
    this.tape.step(tr)
    ++this.steps
    // Should we take snapshot?
    const desiredStep = this.snapshots.length * this.snapshotFrequency
    if (this.steps === desiredStep) {
      this.snapshots.push(new Tape(this.tape))
    }
    return true
  }

  seek(steps: number) {
    if (this.steps === steps) return
    // Find closest snapshot
    const index = Math.min(Math.floor(steps / this.snapshotFrequency), this.snapshots.length - 1)
    // Don't need to jump if we're between index and steps
    if (this.steps < index * this.snapshotFrequency || this.steps > steps) {
      this.tape = new Tape(this.snapshots[index])
      this.steps = index * this.snapshotFrequency
    }
    while (this.steps < steps) if (!this.step()) break
  }

  getMacroTransition(fromStep: number, toStep: number): MacroTransition {
    this.seek(fromStep)
    const startTape = new Tape(this.tape)
    let lh = this.head
    let hh = this.head
    for (let i = fromStep; i < toStep; ++i) {
      lh = Math.min(lh, this.head)
      hh = Math.max(hh, this.head)
      if (!this.step()) break
    }
    const endTape = this.tape
    return {
      from: startTape.getSegment(lh, hh),
      to: endTape.getSegment(lh, hh),
      steps: toStep - fromStep
    }
  }
}
