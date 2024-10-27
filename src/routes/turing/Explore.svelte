<script lang="ts">
  import { cn } from "$lib/utils"
  import { onMount, untrack } from "svelte"
  import {
    getTmStateColor,
    getTmStateColorCss,
    getTmSymbolColor,
    rulesEqual,
    Tape,
    TuringMachine,
    type Transition
  } from "./turing"

  interface Props {
    machine: TuringMachine
    width: number
    height: number
    /** The initial position to explore. */
    position?: {
      t: number
      x: number
    }
    scale?: number
    animate?: boolean
    animateSpeed?: number
    debug?: boolean
  }

  let {
    machine,
    scale = $bindable(8),
    width = $bindable(512),
    height = $bindable(512),
    position = $bindable({
      t: 0,
      x: 0
    }),
    animate = $bindable(false),
    animateSpeed = $bindable(1),
    debug = false
  }: Props = $props()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null
  let offCanvas: OffscreenCanvas
  let offCtx: OffscreenCanvasRenderingContext2D | null
  let m = new TuringMachine() // Non-proxy version.
  let renderTime = $state(0)
  let analyzeMode = $state(false)
  let mouseOver = $state(true)
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

  /** The min and max tape indices to render. */
  function getXBounds() {
    return { left: position.x - Math.ceil(width / scale / 2), right: position.x + Math.ceil(width / scale / 2) }
  }

  function scrollT(delta: number) {
    let d = Math.round((delta * height) / scale)
    if (d === 0) d = Math.sign(delta)
    position.t = Math.max(0, position.t + d)
  }

  function scrollX(delta: number) {
    let d = Math.round((delta * width) / scale)
    if (d === 0) d = Math.sign(delta)
    position.x += d
  }

  /** The x-coordinate of where the offscreen canvas is rendered to the main canvas. */
  function canvasXOffset() {
    return Math.floor((width - offCanvas.width * scale) / 2)
  }

  /** The spacetime coordinates of the mouse.*/
  function hoverPosition() {
    return {
      t: Math.floor(mouseY / scale + position.t),
      x: Math.floor((mouseX - canvasXOffset()) / scale) + getXBounds().left
    }
  }

  function renderOffscreenCanvas() {
    if (ctx == null || offCtx == null || m.rule.length === 0 || scale <= 0 || height <= 0 || position.t < 0) return

    const now = performance.now()
    m.seek(position.t)

    const h = Math.ceil(height / scale)
    const { left, right } = getXBounds()
    offCanvas.width = right - left + 1
    offCanvas.height = h
    offCtx.imageSmoothingEnabled = false
    offCtx.globalCompositeOperation = "copy"

    // Now render
    m.seek(position.t)
    const imageData = offCtx.createImageData(offCanvas.width, offCanvas.height)
    const nSymbols = m.rule[0].length
    const offCanvasWidth = offCanvas.width
    for (let t = 0; t < h; ++t) {
      const lx = Math.max(left, m.tape.leftEdge)
      const hx = Math.min(right, m.tape.rightEdge)
      for (let x = lx; x <= hx; ++x) {
        const index = 4 * (t * offCanvasWidth + x - left)
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
    if (canvas == null || ctx == null || offCanvas.width === 0 || offCanvas.height === 0 || position.t < 0) return

    ctx.imageSmoothingEnabled = false
    ctx.globalCompositeOperation = "copy"
    console.log(width, offCanvas.width * scale, (width - offCanvas.width * scale) / 4)

    ctx.drawImage(offCanvas, canvasXOffset(), 0, offCanvas.width * scale, offCanvas.height * scale)

    if (analyzeMode && mouseOver) {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "rgba(192, 220, 255, 0.5)"
      const { t, x } = hoverPosition()
      ctx.fillRect((x - getXBounds().left) * scale + canvasXOffset(), 0, scale, canvas.height)
      ctx.fillRect(0, (t - position.t) * scale, canvas.width, scale)

      if (t >= 0) {
        m.seek(t)

        mouseOverInfo = {
          t,
          x,
          tape: m.tape,
          transition: m.peek()
        }
      }
    }
  }

  function draw() {
    position.t = Math.max(0, position.t + animateSpeed)
    if (animate) requestAnimationFrame(draw)
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
    offCanvas = new OffscreenCanvas(0, 0)
    offCtx = offCanvas.getContext("2d")!
    const h = Math.floor(height / scale)

    $effect(() => {
      if (!rulesEqual(m.rule, machine.rule)) m = machine.clone()
      renderOffscreenCanvas()
      untrack(() => renderMainCanvas())
    })

    $effect(() => {
      renderMainCanvas()
    })

    $effect(() => {
      if (animate) requestAnimationFrame(draw)
    })
  })
</script>

<canvas
  id="canvas"
  class={cn(
    "mx-auto select-none border",
    analyzeMode ? "focus:outline focus:outline-2 focus:outline-green-500" : "focus:outline-none"
  )}
  {width}
  {height}
  tabindex="0"
  bind:this={canvas}
  onwheel={(e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      let newScale = scale
      if (e.deltaY < 0) newScale = Math.max(scale + 1, Math.round(scale * 1.1))
      else if (e.deltaY > 0 && scale > 1) newScale = Math.min(scale - 1, Math.round(scale / 1.1))
      if (newScale != scale) {
        // Adjust t and x so that mouse is at the same cell as before
        const t = position.t + Math.round(mouseY * (1 / scale - 1 / newScale))
        const x = position.x + Math.round((mouseX - canvasXOffset() - width / 2) * (1 / scale - 1 / newScale))
        if (t >= 0) {
          position.t = t
        }
        position.x = x
        scale = newScale
      }
    } else if (e.altKey) {
      e.preventDefault()
      if (e.deltaY < 0) animateSpeed *= 2
      else if (e.deltaY > 0 && Math.abs(animateSpeed) > 1) animateSpeed = Math.floor(animateSpeed / 2)
    } else {
      e.preventDefault()
      if (e.deltaX !== 0) {
        // Probably using trackpad...
        scrollX(e.deltaX / 2000)
        scrollT(e.deltaY / 750)
      } else {
        if (e.shiftKey) scrollX(e.deltaY / 2000)
        else scrollT(e.deltaY / 750)
      }
    }
  }}
  onkeydown={(e) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        if (analyzeMode) {
        } else {
          scrollT(-(2 ** (-3 + (e.shiftKey ? 1 : 0) + (e.ctrlKey || e.metaKey ? 1 : 0))))
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (analyzeMode) {
        } else {
          scrollT(2 ** (-3 + (e.shiftKey ? 1 : 0) + (e.ctrlKey || e.metaKey ? 1 : 0)))
        }
        break
      case "ArrowLeft":
        e.preventDefault()
        if (analyzeMode) {
        } else {
          scrollX(-(2 ** (-4 + (e.shiftKey ? 1 : 0) + (e.ctrlKey || e.metaKey ? 1 : 0))))
        }
        break
      case "ArrowRight":
        e.preventDefault()
        if (analyzeMode) {
        } else {
          scrollX(2 ** (-4 + (e.shiftKey ? 1 : 0) + (e.ctrlKey || e.metaKey ? 1 : 0)))
        }
        break
      case "PageUp":
        e.preventDefault()
        scrollT(-1)
        break
      case "PageDown":
        e.preventDefault()
        scrollT(1)
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
      case ")":
        if (e.ctrlKey || e.metaKey) scale = 1
        else {
          e.preventDefault()
          if (e.shiftKey) position.x = 0
          else position.t = 0
        }
        break
      case "Insert": // Shift+Numpad0
        position.x = 0
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
          position.t = baseSeek * 10 ** (e.key.charCodeAt(0) - "1".charCodeAt(0))
        }
        break
      case "h":
        e.preventDefault()
        position.x = m.tape.head
        break
      case "l":
        e.preventDefault()
        position.x = m.tape.leftEdge
        break
      case "r":
        e.preventDefault()
        position.x = m.tape.rightEdge
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
{#if debug}
  <div class="self-center">
    Rendering time {renderTime.toFixed(2)} ms | {((renderTime * 1000000 * scale * scale) / (width * height)).toFixed(0)}
    ns per pixel | {mouseX}, {mouseY}
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
