<script lang="ts">
  import { onMount, untrack } from "svelte"
  import { getTmStateColor, getTmSymbolColor, Tape, TuringMachine, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
    scale?: number
    height?: number
    startStep?: number
    animate?: boolean
    animateSpeed?: number
  }

  let {
    rule,
    scale = $bindable(8),
    height = $bindable(900),
    startStep = $bindable(0),
    animate = $bindable(false),
    animateSpeed = $bindable(1)
  }: Props = $props()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null
  let offCanvas: OffscreenCanvas
  let offCtx: OffscreenCanvasRenderingContext2D | null
  let width = $state(0)
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

  function numSteps() {
    return Math.floor(height / scale)
  }

  function actualHeight() {
    return numSteps() * scale
  }

  function scroll(dir: number) {
    startStep = Math.max(0, startStep + Math.round(dir * numSteps()))
  }

  function renderOffCanvas() {
    if (ctx == null || offCtx == null || height <= 0 || startStep < 0) return

    const now = performance.now()
    m.seek(startStep)

    // Run it once to get how wide the canvas should be
    const n = numSteps()
    m.seek(startStep + n)
    const offset = -m.tape.leftEdge

    offCanvas.width = m.tape.size
    offCanvas.height = n
    offCtx.imageSmoothingEnabled = false
    offCtx.globalCompositeOperation = "copy"

    // Now render
    m.seek(startStep)
    const imageData = offCtx.createImageData(offCanvas.width, offCanvas.height)
    const nSymbols = rule[0].length
    const offCanvasWidth = offCanvas.width
    for (let i = 0; i < n; ++i) {
      const tape = m.tape
      for (let j = tape.leftEdge; j <= tape.rightEdge; ++j) {
        const index = 4 * (i * offCanvasWidth + j + offset)
        if (j === tape.head) {
          const color = getTmStateColor(tape.state)
          for (let k = 0; k < 4; ++k) imageData.data[index + k] = color[k]
        } else {
          const color = getTmSymbolColor(tape.at(j), nSymbols)
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
    if (ctx == null || height <= 0 || startStep < 0) return

    canvas.width = offCanvas.width * scale
    canvas.height = offCanvas.height * scale
    ctx.imageSmoothingEnabled = false
    ctx.globalCompositeOperation = "copy"
    ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height)

    if (mouseDown && mouseOver) {
      ctx.globalCompositeOperation = "source-over"
      const y = Math.floor(mouseY / scale) * scale
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.fillRect(0, y, canvas.width, scale)
      mouseOverInfo.t = Math.floor(mouseY / scale) + startStep
      const rect = canvas.getBoundingClientRect()
      mouseOverInfo.x = Math.floor((mouseClientX - rect.left) / scale) + m.tape.leftEdge
      m.seek(mouseOverInfo.t)
      mouseOverInfo.tape = m.tape
    }
  }

  onMount(() => {
    ctx = canvas.getContext("2d")
    offCanvas = new OffscreenCanvas(0, 0)
    offCtx = offCanvas.getContext("2d")

    $effect(() => {
      m = new TuringMachine($state.snapshot(rule)) // Crucial to use $state.snapshot for better performance
    })

    $effect(() => {
      renderOffCanvas()
      renderMainCanvas()
    })
  })
</script>

<div class="flex w-svw flex-col gap-y-3 p-4">
  <div class="relative overflow-auto">
    <canvas
      id="canvas"
      class="border-grey-200 mx-auto select-none border"
      width="1"
      bind:clientWidth={width}
      height="1"
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
        mouseDown = true
        renderMainCanvas()
      }}
      onmouseup={(e) => {
        mouseDown = false
        renderMainCanvas()
      }}
      onmouseenter={(e) => {
        mouseOver = true
        renderMainCanvas()
      }}
      onmouseleave={(e) => {
        mouseOver = false
        renderMainCanvas()
      }}
      onmousemove={(e) => {
        mouseX = e.offsetX
        mouseY = e.offsetY
        mouseClientX = e.clientX
        mouseClientY = e.clientY
        renderMainCanvas()
      }}
    ></canvas>
  </div>
  <div class="self-center">
    Rendering time {renderTime.toFixed(2)} ms | {(
      (renderTime * 1000000 * scale * scale) /
      (width * actualHeight())
    ).toFixed(0)}
    ns per pixel
  </div>
</div>
{#if mouseDown && mouseOver && mouseY > 0}
  <div
    class="pointer-events-none absolute rounded-md bg-slate-700 px-2 py-1"
    style="left: {mouseClientX + 10}px; top: {mouseClientY + 20}px;"
  >
    Step {mouseOverInfo.t} | x = {mouseOverInfo.x}
    {#if mouseOverInfo.tape != null}
      | head = {mouseOverInfo.tape.head} | state = {String.fromCharCode(mouseOverInfo.tape?.state + 65)}
    {/if}
  </div>
{/if}
