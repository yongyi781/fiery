<script lang="ts">
  import { onMount, untrack } from "svelte"
  import {
    formatTMRule,
    getTmStateColor,
    getTmStateColorCss,
    getTmSymbolColor,
    rulesEqual,
    Tape,
    TuringMachine,
    type TMRule,
    type Transition
  } from "./turing"
  import { page } from "$app/stores"
  import { preventDefault } from "svelte/legacy"
  import { cn } from "$lib/utils"

  interface Props {
    rule: TMRule
    width: number
    height: number
    scale?: number
    startStep?: number
    animate?: boolean
    animateSpeed?: number
    debug?: boolean
  }

  let {
    rule,
    scale = $bindable(8),
    width = $bindable(512),
    height = $bindable(512),
    startStep = $bindable(0),
    animate = $bindable(false),
    animateSpeed = $bindable(1),
    debug = false
  }: Props = $props()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null
  let offCanvas: OffscreenCanvas
  let offCtx: OffscreenCanvasRenderingContext2D | null
  let m: TuringMachine
  let renderTime = $state(0)
  let analyzeMode = $state(false)
  let mouseOver = $state(false)
  let mouseX = $state(0)
  let mouseY = $state(0)
  let mouseOverInfo = $state({
    t: 0,
    x: 0,
    tape: new Tape(),
    transition: {
      symbol: 0,
      direction: 1,
      toState: 25
    } as Transition
  })
  let tooltip: HTMLDivElement
  let leftEdge = 0

  // For debug
  let numPixels = $state(1)

  function numSteps() {
    return Math.floor(height / scale)
  }

  function scroll(dir: number) {
    startStep = Math.max(0, startStep + Math.round(dir * numSteps()))
  }

  function renderOffscreenCanvas() {
    if (ctx == null || offCtx == null || rule.length === 0 || scale <= 0 || height <= 0 || startStep < 0) return

    const now = performance.now()
    m.seek(startStep)

    // Run it once to get how wide the canvas should be
    const h = numSteps()
    if (h === 0) return
    m.seek(startStep + h - 1)
    leftEdge = m.tape.leftEdge
    offCanvas.width = m.tape.size
    offCanvas.height = h
    offCtx.imageSmoothingEnabled = false
    offCtx.globalCompositeOperation = "copy"

    // Now render
    m.seek(startStep)
    const imageData = offCtx.createImageData(offCanvas.width, h)
    const nSymbols = rule[0].length
    const offCanvasWidth = offCanvas.width
    for (let t = 0; t < h; ++t) {
      for (let x = m.tape.leftEdge; x <= m.tape.rightEdge; ++x) {
        const index = 4 * (t * offCanvasWidth + x - leftEdge)
        if (x === m.tape.head) {
          const color = getTmStateColor(m.tape.state)
          for (let k = 0; k < 4; ++k) imageData.data[index + k] = color[k]
        } else {
          const color = getTmSymbolColor(m.tape.at(x), nSymbols)
          for (let k = 0; k < 3; ++k) imageData.data[index + k] = color
          imageData.data[index + 3] = 255
        }
      }
      if (!m.step()) break
    }
    offCtx.putImageData(imageData, 0, 0)
    renderTime = performance.now() - now
  }

  function renderMainCanvas() {
    if (canvas == null || ctx == null || numSteps() === 0 || startStep < 0) return

    canvas.width = offCanvas.width * scale
    canvas.height = offCanvas.height * scale
    ctx.imageSmoothingEnabled = false
    ctx.globalCompositeOperation = "copy"
    ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height)

    numPixels = offCanvas.width * offCanvas.height

    if (analyzeMode && mouseOver) {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "rgba(192, 220, 255, 0.5)"
      ctx.fillRect(Math.floor(mouseX / scale) * scale, 0, scale, canvas.height)
      ctx.fillRect(0, Math.floor(mouseY / scale) * scale, canvas.width, scale)

      const x = Math.floor(mouseX / scale) + leftEdge
      const t = Math.floor(mouseY / scale) + startStep
      m.seek(t)

      mouseOverInfo = {
        t: t,
        x: x,
        tape: m.tape,
        transition: m.peek()
      }
    }
  }

  function draw() {
    startStep = Math.max(0, startStep + animateSpeed)
    if (animate) requestAnimationFrame(draw)
  }

  function updateMouse(e: MouseEvent) {
    mouseX = e.offsetX
    mouseY = e.offsetY

    const left = Math.min(e.pageX + 15, visualViewport?.width! - tooltip.clientWidth - 12)
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${e.pageY + 15}px`
  }

  onMount(() => {
    ctx = canvas.getContext("2d")
    offCanvas = new OffscreenCanvas(0, 0)
    offCtx = offCanvas.getContext("2d")

    $effect(() => {
      const u = $page.state.tm
      if (u != null && rulesEqual(u.rule, rule)) {
        // Svelte 5 bug: when navigating back and forth, $page.state loses its prototype.
        m = new TuringMachine(
          u.rule,
          new Tape(u.tape),
          u.steps,
          u.snapshots.map((t) => new Tape(t)),
          u.snapshotFrequency
        )
      } else m = new TuringMachine($state.snapshot(rule)) // Crucial to use $state.snapshot for better performance
      untrack(() => {
        renderOffscreenCanvas()
        renderMainCanvas()
      })
    })

    $effect(() => {
      renderOffscreenCanvas()
      untrack(() => renderMainCanvas())
    })

    $effect(() => {
      if (animate) requestAnimationFrame(draw)
    })

    $effect(() => {
      renderMainCanvas()
    })
  })
</script>

<div class="overflow-auto" style="max-width: {width + 2}px;">
  <canvas
    id="canvas"
    class={cn("mx-auto select-none border", analyzeMode ? "focus:ring-green-500" : "")}
    width="0"
    height={untrack(() => height)}
    tabindex="0"
    bind:this={canvas}
    onwheel={(e) => {
      if (e.shiftKey) return
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) ++scale
        else if (e.deltaY > 0 && scale > 1) --scale
      } else if (e.altKey) {
        e.preventDefault()
        if (e.deltaY < 0) animateSpeed *= 2
        else if (e.deltaY > 0 && Math.abs(animateSpeed) > 1) animateSpeed = Math.floor(animateSpeed / 2)
      } else {
        e.preventDefault()
        scroll(e.deltaY / 500)
      }
    }}
    onkeydown={(e) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          if (analyzeMode) {
          } else {
            scroll(-0.25)
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (analyzeMode) {
          } else {
            scroll(0.25)
          }
          break
        case "PageUp":
          e.preventDefault()
          scroll(-1)
          break
        case "PageDown":
          e.preventDefault()
          scroll(1)
          break
        case " ":
          e.preventDefault()
          animate = !animate
          break
        case "+":
        case "=":
          e.preventDefault()
          animateSpeed *= 2
          break
        case "-":
          e.preventDefault()
          if (Math.abs(animateSpeed) > 1) animateSpeed = Math.floor(animateSpeed / 2)
          break
        case "[":
          e.preventDefault()
          if (scale > 1) --scale
          break
        case "]":
          ++scale
          break
        case "Alt":
          e.preventDefault()
          break
        case "Home":
        case "0":
          if (!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            startStep = 0
          }
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
          if (!e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            const baseSeek = 10
            startStep = baseSeek * 10 ** (e.key.charCodeAt(0) - "1".charCodeAt(0))
          }
          break
      }
    }}
    onmousedown={(e) => {
      if (e.button === 0) {
        analyzeMode = !analyzeMode
        updateMouse(e)
        renderMainCanvas()
      }
    }}
    onmouseenter={(e) => {
      if (e.button === 0) {
        mouseOver = true
        renderMainCanvas()
      }
    }}
    onmouseleave={(e) => {
      if (e.button === 0) {
        mouseOver = false
        renderMainCanvas()
      }
    }}
    onmousemove={(e) => {
      if (analyzeMode) {
        updateMouse(e)
        renderMainCanvas()
      }
    }}
  ></canvas>
</div>
{#if debug}
  <div class="self-center">
    Rendering time {renderTime.toFixed(2)} ms | {(
      (renderTime * 1000000 * scale * scale) /
      (numPixels * scale * scale)
    ).toFixed(0)}
    ns per pixel
  </div>
{/if}
<div
  class="pointer-events-none fixed text-nowrap rounded-md bg-slate-50 px-2 py-1 font-mono text-sm dark:bg-slate-700 {analyzeMode &&
  mouseOver &&
  mouseY >= 0 &&
  mouseOverInfo.tape != null
    ? ''
    : 'hidden'}"
  bind:this={tooltip}
>
  {#if mouseOverInfo.tape != null}
    <h3 class="mb-1 text-center text-lg font-bold">
      <div>({mouseOverInfo.t}, {mouseOverInfo.x})</div>
      <span style="color: {getTmStateColorCss(mouseOverInfo.tape.state)}"
        >{String.fromCharCode(mouseOverInfo.tape.state + 65)}{mouseOverInfo.tape.read()}</span
      >
      {#if mouseOverInfo.transition != null}
        &mapsto;
        {mouseOverInfo.transition.symbol}{mouseOverInfo.transition.direction === 1 ? "R" : "L"}<span
          style="color: {getTmStateColorCss(mouseOverInfo.transition.toState)}"
          >{String.fromCharCode(mouseOverInfo.transition.toState + 65)}</span
        >
      {/if}
    </h3>
    <div class="grid grid-cols-[auto_auto] gap-x-4">
      <div class="text-right font-semibold">Tape size</div>
      <div class="text-right">{mouseOverInfo.tape.size}</div>
      <div class="text-right font-semibold">Head</div>
      <div class="text-right">{mouseOverInfo.tape.head}</div>
      <div class="text-right font-semibold">Tape[{mouseOverInfo.x}]</div>
      <div class="text-right">{mouseOverInfo.tape.at(mouseOverInfo.x)}</div>
    </div>
  {/if}
</div>
