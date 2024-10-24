<script lang="ts">
  import { onMount, untrack } from "svelte"
  import { getTmSymbolColor, Tape, TuringMachine, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
    width?: number
    height?: number
    numSteps?: number
    quality?: number
    debug?: boolean
  }

  let { rule, width = 768, height = 768, numSteps = $bindable(1024), quality = 1, debug = false }: Props = $props()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null
  let m = new TuringMachine($state.snapshot(rule))

  let renderTime = $state(0)

  function getTapes(start: number, end: number, n: number) {
    const res: Tape[] = []
    for (let i = 0; i < n; ++i) {
      const t = (2 * i + 1) / (2 * n)
      const index = Math.round((1 - t) * start + t * end)
      m.seek(index)
      res.push(m.tape.clone())
    }
    return res
  }

  function getColor(tape: Tape, start: number, end: number, nSymbols: number) {
    let res = 0
    for (let i = start; i < end; ++i) res += getTmSymbolColor(tape.at(i), nSymbols)
    return Math.round(res / (end - start))
  }

  function draw() {
    if (ctx == null) return
    const now = performance.now()
    m.seek(numSteps)
    const xmax = Math.max(Math.floor(width / 2), -m.tape.leftEdge, m.tape.rightEdge)
    m.seek(0)
    const imageData = ctx.createImageData(width, height)
    const nSymbols = rule[0].length
    const windowHeight = numSteps / height
    const windowWidth = (2 * xmax) / width
    for (let i = 0; i < height; ++i) {
      const lt = Math.floor(i * windowHeight)
      const ht = Math.floor((i + 1) * windowHeight)
      const tapes = getTapes(lt, ht, quality)
      if (m.halted) break
      for (let j = 0; j < width; ++j) {
        const lx = Math.floor((j - Math.floor(width / 2)) * windowWidth)
        const hx = Math.floor((j + 1 - Math.floor(width / 2)) * windowWidth)

        if (hx < m.tape.leftEdge || lx > m.tape.rightEdge) continue
        let color = tapes.map((tape) => getColor(tape, lx, hx, nSymbols)).reduce((a, b) => a + b, 0)
        const index = 4 * (i * width + j)
        for (let k = 0; k < 3; ++k) imageData.data[index + k] = color / quality
        imageData.data[index + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
    renderTime = performance.now() - now
  }

  onMount(() => {
    ctx = canvas.getContext("2d")

    $effect(() => {
      m = new TuringMachine($state.snapshot(rule)) // Crucial to use $state.snapshot for better performance
      untrack(() => {
        draw()
      })
    })

    $effect(() => {
      draw()
    })
  })
</script>

<canvas
  id="canvas"
  class="border-grey-200 mx-auto select-none border"
  {width}
  {height}
  tabindex="0"
  bind:this={canvas}
  onwheel={(e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY > 0) numSteps *= 2
      else if (e.deltaY < 0 && numSteps > 1) numSteps = Math.floor(numSteps / 2)
    }
  }}
  onkeydown={(e) => {
    switch (e.key) {
      case "+":
      case "=":
        e.preventDefault()
        numSteps *= 2
        break
      case "-":
        e.preventDefault()
        if (numSteps > 1) numSteps = Math.floor(numSteps / 2)
        break
      case "Alt":
        e.preventDefault()
        break
      case "Home":
      case "0":
        e.preventDefault()
        numSteps = 65536
        break
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        e.preventDefault()
        const baseNumSteps = 2048
        numSteps = baseNumSteps * 2 ** (e.key.charCodeAt(0) - "1".charCodeAt(0))
        break
    }
  }}
></canvas>
{#if debug}
  <div class="self-center">
    Rendering time {renderTime.toFixed(2)} ms | {((renderTime * 1000000) / (width * height)).toFixed(0)}
    ns per pixel
  </div>
{/if}
