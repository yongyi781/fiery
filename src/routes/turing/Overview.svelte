<script lang="ts">
  import { onMount, untrack } from "svelte"
  import { getTmSymbolColor, TuringMachine, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
    width?: number
    height?: number
    numSteps?: number
    debug?: boolean
  }

  let { rule, width = 768, height = 768, numSteps = $bindable(1024), debug = false }: Props = $props()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null
  let m = new TuringMachine($state.snapshot(rule))

  let renderTime = $state(0)

  function draw() {
    if (ctx == null) return
    const now = performance.now()
    m.seek(numSteps)
    const xmaxValue = Math.max(width / 2, -m.tape.leftEdge, m.tape.rightEdge)
    m.seek(0)
    const imageData = ctx.createImageData(width, height)
    const nSymbols = rule[0].length
    for (let i = 0; i < height; ++i) {
      m.seek(Math.round(((i + 0.2) / height) * numSteps))
      const tape0 = m.tape.clone()
      m.seek(Math.round(((i + 0.4) / height) * numSteps))
      const tape1 = m.tape.clone()
      m.seek(Math.round(((i + 0.6) / height) * numSteps))
      const tape2 = m.tape.clone()
      m.seek(Math.round(((i + 0.8) / height) * numSteps))
      const tape3 = m.tape.clone()
      if (m.halted) break
      for (let j = 0; j < width; ++j) {
        const xr = ((2 * j + 1) / width - 1) * xmaxValue
        if (xr < m.tape.leftEdge || xr > m.tape.rightEdge) continue
        const color0 = getTmSymbolColor(tape0.at(Math.round(xr)), nSymbols)
        const color1 = getTmSymbolColor(tape1.at(Math.round(xr)), nSymbols)
        const color2 = getTmSymbolColor(tape2.at(Math.round(xr)), nSymbols)
        const color3 = getTmSymbolColor(tape3.at(Math.round(xr)), nSymbols)
        const index = 4 * (i * width + j)
        for (let k = 0; k < 3; ++k) imageData.data[index + k] = (color0 + color1 + color2 + color3) / 4
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
    e.preventDefault()
    if (e.deltaY > 0) numSteps *= 2
    else if (e.deltaY < 0 && numSteps > 1) numSteps = Math.floor(numSteps / 2)
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
