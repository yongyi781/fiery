import { getTmSymbolColor, Tape, TuringMachine, type TMRule } from "./turing"

function getTapes(m: TuringMachine, start: number, end: number, n: number) {
  const res: Tape[] = []
  for (let i = 0; i < n; ++i) {
    const t = i / n
    m.seek(Math.round((1 - t) * start + t * end))
    res.push(m.tape.clone())
  }
  return res
}

function getColor(tape: Tape, start: number, end: number, nSymbols: number) {
  let res = 0
  for (let i = start; i < end; ++i) res += getTmSymbolColor(tape.at(i), nSymbols)
  return Math.round(res / (end - start))
}

self.onmessage = (event: MessageEvent) => {
  const {
    rule,
    width,
    height,
    numSteps,
    quality
  }: {
    rule: TMRule
    width: number
    height: number
    numSteps: number
    quality: number
  } = event.data
  const m = new TuringMachine(rule)
  const now = performance.now()
  // Get tape size first
  m.seek(numSteps)
  const xmax = Math.max(Math.floor(width / 2), -m.tape.leftEdge, m.tape.rightEdge)
  m.seek(0)
  // Non-svelte snapshots for performance
  const w = width
  const h = height
  const q = quality
  const imageData = new ImageData(width, height)
  const nSymbols = m.rule[0].length
  const windowHeight = numSteps / height
  const windowWidth = (2 * xmax) / width
  for (let i = 0; i < h; ++i) {
    const lt = Math.floor(i * windowHeight)
    const ht = Math.floor((i + 1) * windowHeight)
    const tapes = getTapes(m, lt, ht, q)
    if (m.halted) break
    if (xmax === Math.floor(w / 2)) {
      // 1-1
      for (let x = m.tape.leftEdge; x <= m.tape.rightEdge; ++x) {
        const index = 4 * (i * w + x + xmax)
        const color = tapes.map((tape) => getTmSymbolColor(tape.at(x), nSymbols)).reduce((a, b) => a + b, 0) / q
        for (let k = 0; k < 3; ++k) imageData.data[index + k] = color
        imageData.data[index + 3] = 255
      }
    } else {
      // Downsample
      for (let j = 0; j < w; ++j) {
        const lx = Math.floor((j - Math.floor(w / 2)) * windowWidth)
        const hx = Math.floor((j + 1 - Math.floor(w / 2)) * windowWidth)

        if (hx < m.tape.leftEdge || lx > m.tape.rightEdge) continue
        const color = tapes.map((tape) => getColor(tape, lx, hx, nSymbols)).reduce((a, b) => a + b, 0) / q
        const index = 4 * (i * w + j)
        for (let k = 0; k < 3; ++k) imageData.data[index + k] = color
        imageData.data[index + 3] = 255
      }
    }
  }
  m.snapshots = []
  const elapsed = performance.now() - now
  self.postMessage({ buffer: imageData.data.buffer, elapsed }, { transfer: [imageData.data.buffer] })
}
