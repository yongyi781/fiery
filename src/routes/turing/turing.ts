export const tmStateColors = [
  [255, 179, 196, 255],
  [255, 203, 111, 255],
  [147, 222, 255, 255],
  [169, 237, 154, 255],
  [242, 191, 255, 255],
  [98, 243, 219, 255],
  [221, 223, 117, 255],
  [255, 255, 255, 255],
  [255, 0, 0, 255] // Solid red for halt
]

export const maxSymbolColor = 165

export function getTmSymbolColor(x: number, nSymbols: number) {
  return Math.round((x / (nSymbols - 1)) * maxSymbolColor)
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

export const defaultTM = "1RB0RC_1LB1LD_0RA0LD_1LA1RC"

export type Transition = {
  symbol: number
  direction: -1 | 1
  toState: number
}

/** A Turing tape, along with a head and a state. */
export class Tape {
  data = new Uint8Array(1)
  head = 0
  state = 0
  offset = 0
  leftEdge = 0
  rightEdge = 0

  at(i: number) {
    return this.data[i + this.offset] ?? 0
  }

  read() {
    return this.at(this.head)
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

  get size() {
    return this.rightEdge - this.leftEdge + 1
  }

  clone() {
    const t = new Tape()
    t.data = this.data.slice()
    t.head = this.head
    t.state = this.state
    t.offset = this.offset
    t.leftEdge = this.leftEdge
    t.rightEdge = this.rightEdge
    return t
  }
}

export type TMRule = Transition[][]

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
          const toState = String.fromCharCode(tr.toState + 65)
          return `${symbol}${direction}${toState}`
        })
        .join("")
    )
    .join("_")
}

export const turingSnapshotFreq = 32768

/** A Turing machine. */
export class TuringMachine {
  rule: TMRule
  tape: Tape
  steps: number
  snapshots: Tape[]

  constructor(rule: TMRule, tape: Tape = new Tape(), steps = 0) {
    this.rule = rule
    this.tape = tape
    this.steps = steps
    this.snapshots = [tape.clone()]
  }

  get halted() {
    return this.tape.state < 0 || this.tape.state >= this.rule.length
  }

  peek() {
    return this.rule[this.tape.state]?.[this.tape.read()]
  }

  step() {
    const tr = this.peek()
    if (!tr) return false
    this.tape.step(tr)
    ++this.steps
    // Should we take snapshot?
    const desiredStep = this.snapshots.length * turingSnapshotFreq
    if (this.steps === desiredStep) {
      this.snapshots.push(this.tape.clone())
    }
    return true
  }

  seek(steps: number) {
    if (this.steps === steps) return
    // Find closest snapshot
    const index = Math.min(Math.floor(steps / turingSnapshotFreq), this.snapshots.length - 1)
    // Don't need to jump if we're between index and steps
    if (this.steps < index * turingSnapshotFreq || this.steps > steps) {
      this.tape = this.snapshots[index].clone()
      this.steps = index * turingSnapshotFreq
    }
    while (this.steps < steps) if (!this.step()) break
  }

  clone() {
    const m = new TuringMachine(this.rule, this.tape.clone(), this.steps)
    m.snapshots = this.snapshots
    return m
  }
}
