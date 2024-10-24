<script lang="ts">
  import { onMount, untrack } from "svelte"
  import { getTmStateColor, getTmStateColorCss, getTmSymbolColor, Tape, TuringMachine, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
    scale?: number
    width?: number
    height?: number
    startStep?: number
    animate?: boolean
    animateSpeed?: number
    debug?: boolean
  }

  let {
    rule,
    scale = $bindable(8),
    width = $bindable(768),
    height = $bindable(768),
    startStep = $bindable(0),
    animate = $bindable(false),
    animateSpeed = $bindable(1),
    debug = false
  }: Props = $props()

  let canvas: HTMLCanvasElement | undefined = $state()
  let ctx: CanvasRenderingContext2D | null
  let offCanvas: OffscreenCanvas
  let offCtx: OffscreenCanvasRenderingContext2D | null
  let m = new TuringMachine($state.snapshot(rule))
  let renderTime = $state(0)
  let mouseDown = $state(false)
  let mouseOver = $state(false)
  let mouseX = 0
  let mouseY = $state(0)
  let mouseClientX = $state(0)
  let mouseClientY = $state(0)
  let mouseOverInfo = $state({
    tape: undefined as Tape | undefined,
    t: 0,
    x: 0
  })
  // svelte-ignore non_reactive_update
  let tooltip: HTMLDivElement

  function numSteps() {
    return Math.floor(height / scale)
  }

  function scroll(dir: number) {
    startStep = Math.max(0, startStep + Math.round(dir * numSteps()))
  }

  function renderOffCanvas() {
    if (ctx == null || offCtx == null || rule.length === 0 || scale <= 0 || height <= 0 || startStep < 0) return

    const now = performance.now()
    m.seek(startStep)

    // Run it once to get how wide the canvas should be
    const w = Math.floor(width / scale)
    const h = numSteps()
    if (h === 0) return
    m.seek(startStep + h)
    const offset = -m.tape.leftEdge
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
        const index = 4 * (t * offCanvasWidth + x + offset)
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

    if (mouseDown && mouseOver) {
      const rect = canvas.getBoundingClientRect()
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "rgba(192, 220, 255, 0.5)"
      ctx.fillRect(Math.floor(mouseX / scale) * scale, 0, scale, canvas.height)
      ctx.fillRect(0, Math.floor(mouseY / scale) * scale, canvas.width, scale)
      mouseOverInfo.x = Math.floor((mouseClientX - rect.left) / scale) + m.tape.leftEdge
      mouseOverInfo.t = Math.floor(mouseY / scale) + startStep
      m.seek(mouseOverInfo.t)
      mouseOverInfo.tape = m.tape
    }
  }

  onMount(() => {
    ctx = canvas!.getContext("2d")
    offCanvas = new OffscreenCanvas(0, 0)
    offCtx = offCanvas.getContext("2d")

    $effect(() => {
      m = new TuringMachine($state.snapshot(rule)) // Crucial to use $state.snapshot for better performance
      untrack(() => {
        renderOffCanvas()
        renderMainCanvas()
      })
    })

    $effect(() => {
      renderOffCanvas()
      untrack(() => renderMainCanvas())
    })

    $effect(() => {
      renderMainCanvas()
    })
  })
</script>

<div class="overflow-auto" style="max-width: {width}px;">
  <canvas
    id="canvas"
    class="border-grey-200 mx-auto select-none overflow-auto border"
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
        scroll(Math.sign(e.deltaY))
      }
    }}
    onkeydown={(e) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          scroll(-0.5)
          break
        case "PageUp":
          e.preventDefault()
          scroll(-1)
          break
        case "ArrowDown":
          e.preventDefault()
          scroll(0.5)
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
        case "Alt":
          e.preventDefault()
          break
        case "Home":
        case "0":
          e.preventDefault()
          startStep = 0
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
          const baseSeek = 10
          startStep = baseSeek * 10 ** (e.key.charCodeAt(0) - "1".charCodeAt(0))
          break
      }
    }}
    onmousedown={(e) => {
      if (e.button === 0) {
        mouseDown = true
        renderMainCanvas()
      }
    }}
    onmouseup={(e) => {
      if (e.button === 0) {
        mouseDown = false
      }
      if (e.button === 0) {
        renderMainCanvas()
      }
    }}
    onmouseenter={(e) => {
      if (e.button === 0) {
        mouseOver = true
      }
      if (e.button === 0) {
        renderMainCanvas()
      }
    }}
    onmouseleave={(e) => {
      if (e.button === 0) {
        mouseOver = false
      }
      if (e.button === 0) {
        renderMainCanvas()
      }
    }}
    onmousemove={(e) => {
      mouseX = e.offsetX
      mouseY = e.offsetY
      mouseClientX = e.clientX
      mouseClientY = e.clientY

      const left = Math.min(e.clientX + 15, visualViewport?.width! - tooltip.clientWidth - 12)
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${e.clientY + 15}px`
      renderMainCanvas()
    }}
  ></canvas>
</div>
{#if debug && canvas != null}
  <div class="self-center">
    Rendering time {renderTime.toFixed(2)} ms | {(
      (renderTime * 1000000 * scale * scale) /
      (canvas.width * canvas.height)
    ).toFixed(0)}
    ns per pixel
  </div>
{/if}
<div
  class="pointer-events-none absolute text-nowrap rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-700 {mouseDown &&
  mouseOver &&
  mouseY >= 0 &&
  mouseOverInfo.tape != null
    ? ''
    : 'hidden'}"
  bind:this={tooltip}
>
  {#if mouseOverInfo.tape != null}
    <h3 class="mb-1 text-lg font-bold">
      {mouseOverInfo.t}
      <span style="color: {getTmStateColorCss(mouseOverInfo.tape.state)}"
        >{String.fromCharCode(mouseOverInfo.tape.state + 65)}{mouseOverInfo.tape.read()}</span
      >
    </h3>
    <div class="grid grid-cols-[auto_auto] gap-x-1">
      <div class=" font-semibold">Size</div>
      <div class="text-right">{mouseOverInfo.tape.size}</div>
      <div class=" font-semibold">Head</div>
      <div class="text-right">{mouseOverInfo.tape.head}</div>
      <div class=" font-semibold">Tape[{mouseOverInfo.x}]</div>
      <div class="text-right">{mouseOverInfo.tape.at(mouseOverInfo.x)}</div>
    </div>
  {/if}
</div>
