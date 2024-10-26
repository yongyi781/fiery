<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { onMount, untrack } from "svelte"
  import { formatTMRule, getTmSymbolColor, rulesEqual, Tape, TuringMachine, type TMRule } from "./turing"
  import { cn } from "$lib/utils"
  import workerUrl from "./overview-worker?url"

  interface Props {
    machine: TuringMachine
    width: number
    height: number
    numSteps?: number
    quality?: number
    interactive?: boolean
    debug?: boolean
  }

  let {
    machine,
    width,
    height,
    numSteps = $bindable(16384),
    quality = 1,
    interactive = false,
    debug = false
  }: Props = $props()

  let canvas: HTMLCanvasElement
  let buffer: ArrayBufferLike
  let ctx: CanvasRenderingContext2D | null
  let m = new TuringMachine() // Non-proxy version.
  let renderTime = $state(0)
  let analyzeMode = $state(false)
  let mouseOver = $state(false)
  let mouseY = $state(0)
  let tooltip: HTMLDivElement
  let mouseOverInfo = $derived.by(() => {
    const t = Math.round((mouseY / height) * numSteps)
    if (t < 0 || t >= numSteps) return null
    m.seek(t)
    return {
      t,
      tape: m.tape.clone(),
      transition: m.peek()
    }
  })

  function renderOffscreenCanvas() {
    const w = new Worker(workerUrl, { type: "module" })
    w.onmessage = (e) => {
      ctx = canvas.getContext("2d")!
      renderTime = e.data.elapsed
      buffer = e.data.buffer
      renderMainCanvas()
    }
    // Make buffer from snapshots to transfer
    w.postMessage({
      rule: m.rule,
      width,
      height,
      numSteps,
      quality
    })
  }

  function renderMainCanvas() {
    if (canvas == null || ctx == null) return

    if (buffer != null) {
      ctx.imageSmoothingEnabled = false
      ctx.globalCompositeOperation = "copy"
      ctx.putImageData(new ImageData(new Uint8ClampedArray(buffer), width, height), 0, 0)
    }

    if (analyzeMode && mouseOver) {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "rgba(192, 220, 255, 0.5)"
      ctx.fillRect(0, mouseY, canvas.width, 1)
    }
  }

  function updateMouse(e: MouseEvent) {
    mouseY = e.offsetY

    const left = Math.min(e.pageX + 15, visualViewport?.width! - tooltip.clientWidth - 12)
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${e.pageY + 15}px`
  }

  onMount(() => {
    ctx = canvas.getContext("2d")

    $effect(() => {
      if (!rulesEqual(m.rule, machine.rule)) m = machine.clone()
      renderOffscreenCanvas()
      untrack(() => renderMainCanvas())
    })

    $effect(() => {
      renderMainCanvas()
    })
  })
</script>

<canvas
  id="canvas"
  class={cn("mx-auto select-none border", analyzeMode ? "border border-green-500" : "")}
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
        const baseNumSteps = 131072
        numSteps = baseNumSteps * 2 ** (e.key.charCodeAt(0) - "1".charCodeAt(0))
        break
    }
  }}
  onmousedown={(e) => {
    if (interactive && e.button === 0) {
      analyzeMode = !analyzeMode
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
  ondblclick={(e) => {
    goto(`/turing/explore/${formatTMRule(m.rule)}?t=${mouseOverInfo?.t}`, { state: { tm: m } })
  }}
></canvas>
{#if debug}
  <div class="self-center">
    Rendering time {renderTime.toFixed(2)} ms | {((renderTime * 1000000) / (width * height)).toFixed(0)}
    ns per pixel
  </div>
{/if}

<div
  class="pointer-events-none fixed text-nowrap rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-700 {(!analyzeMode ||
    !interactive ||
    !mouseOver ||
    mouseOverInfo?.tape == null) &&
    'hidden'}"
  bind:this={tooltip}
>
  {#if analyzeMode && interactive && mouseOverInfo?.tape != null}
    <h3 class="mb-1 text-center font-mono text-lg font-bold">
      {mouseOverInfo.t}
    </h3>
    <div class="grid grid-cols-[auto_auto] gap-x-4 font-mono text-sm">
      <div class="text-right font-semibold">Tape size</div>
      <div class="text-left">{mouseOverInfo.tape.size}</div>
      <div class="text-right font-semibold">Left edge</div>
      <div class="text-left">{mouseOverInfo.tape.leftEdge}</div>
      <div class="text-right font-semibold">Right edge</div>
      <div class="text-left">{mouseOverInfo.tape.rightEdge}</div>
    </div>
  {/if}
</div>
