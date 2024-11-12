<script lang="ts">
  import { goto } from "$app/navigation"
  import { cn } from "$lib/utils"
  import { onMount, untrack } from "svelte"
  import { formatTMRule, Tape, TuringMachine, writeColor, type TuringMachineInfo } from "./turing"
  import { turingMachineCache } from "./turing-machine-cache.svelte"

  interface Props {
    machineInfo: TuringMachineInfo
    width: number
    height: number
    numSteps?: number
    quality?: number
    interactive?: boolean
    debug?: boolean
  }

  let {
    machineInfo,
    width,
    height,
    numSteps = $bindable(16384),
    quality = 1,
    interactive = false,
    debug = false
  }: Props = $props()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null
  let imageData: ImageData
  let m = new TuringMachine() // Non-proxy version.
  let renderTime = $state(0)
  let analyzeMode = $state(false)
  let mouseOver = $state(true)
  let mouseX = $state(0)
  let mouseY = $state(0)
  let tooltip: HTMLDivElement
  let mouseOverInfo = $derived.by(() => {
    const { t, x } = hoverPosition()
    if (t < 0 || t >= numSteps) return null
    m.seek(t)
    return {
      t,
      x,
      tape: new Tape(m.tape),
      transition: m.peek()
    }
  })

  function sampleTapes(start: number, end: number, n: number) {
    const res: Tape[] = []
    for (let i = 0; i < n; ++i) {
      const t = i / n
      m.seek(Math.round((1 - t) * start + t * end))
      res.push(new Tape(m.tape))
    }
    return res
  }

  function averageSymbol(tape: Tape, start: number, end: number, nSymbols: number) {
    let res = 0
    const h = nSymbols - 1
    if (end - start < 512) {
      for (let i = start; i < end; ++i) res += tape.at(i) ** 2.2
      return (res / (end - start)) ** (1 / 2.2) / h
    } else {
      // To handle translated cyclers whose tapes grow linearly without being super slow
      const step = Math.ceil((end - start) / 50)
      const n = Math.floor((end - start) / step)
      for (let i = start; i < end; i += step) res += tape.at(i) ** 2.2
      return (res / n) ** (1 / 2.2) / h
    }
  }

  function averageTapes(tapes: Tape[], f: (tape: Tape) => number) {
    if (tapes.length === 1) return f(tapes[0])
    let res = 0
    for (let t of tapes) res += f(t) ** 2.2
    return (res / tapes.length) ** (1 / 2.2)
  }

  /** x-scale of the view, as measured by x-coordinate of the right edge. */
  function getXmax() {
    return Math.max(Math.floor(width / 2), -m.tape.leftEdge, m.tape.rightEdge)
  }

  /** The spacetime coordinates of the mouse.*/
  function hoverPosition() {
    return {
      t: Math.round((mouseY / height) * numSteps),
      x: Math.floor(((2 * mouseX) / width - 1) * getXmax())
    }
  }

  function renderImageData() {
    if (ctx == null || m.rule.length === 0) return
    const now = performance.now()
    imageData = new ImageData(width, height)
    // Get tape size first
    m.seek(numSteps)
    const xmax = getXmax()
    const oneToOne = m.tape.leftEdge >= Math.floor(-(width - 1) / 2) && m.tape.rightEdge <= Math.floor((width - 1) / 2)
    m.seek(0)
    // Non-svelte snapshots for performance
    const w = width
    const h = height
    const q = quality
    const nSymbols = m.rule[0].length
    const windowHeight = numSteps / height
    const windowWidth = (2 * xmax) / width
    for (let i = 0; i < h; ++i) {
      const lt = Math.floor(i * windowHeight)
      const ht = Math.floor((i + 1) * windowHeight)
      const tapes = sampleTapes(lt, ht, q)
      if (m.halted) break
      if (oneToOne) {
        // 1-1
        for (let x = m.tape.leftEdge; x <= m.tape.rightEdge; ++x)
          writeColor(
            imageData,
            4 * (i * w + x + xmax),
            averageTapes(tapes, (tape) => tape.at(x) / (nSymbols - 1))
          )
      } else {
        // Downsample
        for (let j = 0; j < w; ++j) {
          const lx = Math.floor((j - Math.floor(w / 2)) * windowWidth)
          const hx = Math.floor((j + 1 - Math.floor(w / 2)) * windowWidth)

          if (hx < m.tape.leftEdge || lx > m.tape.rightEdge) continue
          writeColor(
            imageData,
            4 * (i * w + j),
            averageTapes(tapes, (tape) => averageSymbol(tape, lx, hx, nSymbols))
          )
        }
      }
    }
    renderTime = performance.now() - now
  }

  function renderCanvas() {
    if (canvas == null || ctx == null) return

    if (imageData != null) ctx.putImageData(imageData, 0, 0)

    if (analyzeMode && mouseOver) {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "rgb(192 220 255 / 0.5)"
      ctx.fillRect(0, mouseY, canvas.width, 1)
    }
  }

  function updateMouse(e: MouseEvent) {
    mouseX = e.offsetX
    mouseY = e.offsetY

    const left = Math.min(e.x + 15, visualViewport?.width! - tooltip.clientWidth - 12)
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${e.y + 15}px`
  }

  onMount(() => {
    ctx = canvas.getContext("2d")

    $effect(() => {
      m = new TuringMachine(machineInfo)
      untrack(() => {
        renderImageData()
        renderCanvas()
      })
    })

    $effect(() => {
      renderImageData()
      untrack(() => renderCanvas())
    })

    $effect(() => {
      renderCanvas()
    })
  })
</script>

<canvas
  id="canvas"
  class={cn(
    "mx-auto select-none border",
    analyzeMode ? "focus:outline focus:outline-2 focus:outline-blue-500" : "focus:outline-none"
  )}
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
      case "Enter":
        e.preventDefault()
        analyzeMode = true
        break
      case "Escape":
        e.preventDefault()
        analyzeMode = false
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
        const baseNumSteps = 131072
        numSteps = baseNumSteps * 2 ** (e.key.charCodeAt(0) - "1".charCodeAt(0))
        break
    }
  }}
  onmousedown={(e) => {
    if (interactive && e.button === 0) {
      analyzeMode = true
      updateMouse(e)
    }
  }}
  onmouseenter={(e) => {
    if (interactive && e.button === 0) {
      mouseOver = true
    }
  }}
  onmouseleave={(e) => {
    if (interactive && e.button === 0) {
      mouseOver = false
    }
  }}
  onmousemove={(e) => {
    if (interactive) {
      updateMouse(e)
    }
  }}
  onblur={() => {
    analyzeMode = false
  }}
  ondblclick={() => {
    turingMachineCache.value = m
    goto(`/turing/explore/${formatTMRule(m.rule)}?t=${mouseOverInfo?.t}&x=${mouseOverInfo?.x}`)
  }}
></canvas>
{#if debug}
  <div>
    Rendering time {renderTime.toFixed(2)} ms | {((renderTime * 1000000) / (width * height)).toFixed(0)}
    ns per pixel
  </div>
{/if}
<div
  class="pointer-events-none fixed text-nowrap rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-900 {(!analyzeMode ||
    !interactive ||
    !mouseOver ||
    mouseOverInfo?.tape == null) &&
    'hidden'}"
  bind:this={tooltip}
>
  {#if analyzeMode && interactive && mouseOverInfo?.tape != null}
    <h3 class="mb-1 text-center font-mono text-lg font-bold">
      ({mouseOverInfo.t}, {mouseOverInfo.x})
    </h3>
    <div class="grid grid-cols-[auto_auto] gap-x-4 font-mono text-sm">
      <div class="text-right font-semibold">Tape extent</div>
      <div>
        [{mouseOverInfo.tape.leftEdge}, {mouseOverInfo.tape.rightEdge}] (size = {mouseOverInfo.tape.size})
      </div>
    </div>
  {/if}
</div>
