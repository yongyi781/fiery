<script lang="ts">
  import TapeSpan from "./TapeSpan.svelte"

  import { cn } from "$lib/utils"
  import { Check, Copy } from "lucide-svelte"
  import { onMount, untrack } from "svelte"
  import StateSpan from "./StateSpan.svelte"
  import {
    getTmStateColor,
    getTmSymbolColor,
    Tape,
    TuringMachine,
    type MacroTransition,
    type Transition,
    type TuringMachineInfo
  } from "./turing"

  interface Props {
    machineInfo: TuringMachineInfo
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

  interface Point {
    t: number
    x: number
  }

  interface Selection {
    start?: Point
    end?: Point
  }

  let {
    machineInfo,
    width = 1024,
    height = 768,
    scale = $bindable(2),
    /** The (t, x) coordinates of the top middle of the canvas. */
    position = $bindable({
      t: 0,
      x: 0
    }),
    animate = $bindable(false),
    /** Animation speed in steps per second. */
    animateSpeed = $bindable(1),
    debug = false
  }: Props = $props()

  /** The min and max tape indices to render. */
  const xboundsTX = $derived({
    left: position.x - Math.ceil(width / scale / 2),
    right: position.x + Math.ceil(width / scale / 2)
  })

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D | null
  let offCanvas: OffscreenCanvas
  let offCtx: OffscreenCanvasRenderingContext2D | null
  let statusBar: HTMLDivElement
  // svelte-ignore non_reactive_update
  let m = new TuringMachine() // Non-proxy version.
  let renderTime = $state(0)
  let prevTime: DOMHighResTimeStamp
  let analyzeMode = $state(false)
  /** Canvas coordinates of the mouse. */
  let mouseXY = $state({ x: 0, y: 0 })
  /** The spacetime coordinates of the mouse.*/
  const mouseTX = $derived({
    t: Math.floor(mouseXY.y / scale + position.t),
    x: Math.floor((mouseXY.x - canvasOffsetX()) / scale) + xboundsTX.left
  })
  let mouseOverInfo = $state({
    tape: new Tape(),
    transition: {
      symbol: 0,
      direction: 1,
      toState: 25
    } as Transition
  })
  let selectionTX: Selection = $state({})
  const selectionRectTX = $derived.by(() => {
    if (selectionTX.start == null) return
    const end = selectionTX.end == null ? mouseTX : selectionTX.end
    return {
      t: Math.min(selectionTX.start.t, end.t),
      x: Math.min(selectionTX.start.x, end.x),
      w: Math.abs(end.x - selectionTX.start.x) + 1,
      h: Math.abs(end.t - selectionTX.start.t) + 1
    }
  })
  let copied = $state(false)

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

  function viewWidthTX() {
    return xboundsTX.right - xboundsTX.left + 1
  }

  /** The x-coordinate of where the offscreen canvas is rendered to the main canvas. */
  function canvasOffsetX() {
    return Math.floor((width - viewWidthTX() * scale) / 2)
  }

  /** Converts from (t, x) coordinates to (x, y) coordinates. */
  function toScreen(p: Point) {
    return {
      x: (p.x - xboundsTX.left) * scale + canvasOffsetX(),
      y: (p.t - position.t) * scale
    }
  }

  function renderOffscreenCanvas() {
    if (ctx == null || offCtx == null || m.rule.length === 0 || scale <= 0 || height <= 0 || position.t < 0) return

    const now = performance.now()
    m.seek(position.t)

    const h = Math.ceil(height / scale)
    const { left, right } = xboundsTX
    offCanvas.width = viewWidthTX()
    offCanvas.height = h
    offCtx.imageSmoothingEnabled = false
    offCtx.globalCompositeOperation = "copy"

    // Now render
    m.seek(position.t)
    const imageData = offCtx.createImageData(offCanvas.width, offCanvas.height)
    const nSymbols = m.rule[0].length
    const offCanvasWidth = viewWidthTX()
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

    ctx.drawImage(offCanvas, canvasOffsetX(), 0, offCanvas.width * scale, offCanvas.height * scale)

    if (analyzeMode) {
      const { x, y } = toScreen(mouseTX)
      ctx.globalCompositeOperation = "source-over"
      ctx.lineWidth = 2
      if (selectionRectTX == null) {
        ctx.strokeStyle = "rgb(192 220 255 / 0.2)"
        ctx.strokeRect(0, y, canvas.width, scale)
        ctx.strokeStyle = "rgb(192 220 255 / 0.8)"
        ctx.strokeRect(x, y, scale, scale)
      } else {
        let { x: x1, y: y1 } = toScreen(selectionRectTX)
        let { x: x2, y: y2 } = toScreen({
          t: selectionRectTX.t + selectionRectTX.h,
          x: selectionRectTX.x + selectionRectTX.w
        })
        x1 = Math.min(width, Math.max(-1, x1))
        y1 = Math.min(height, Math.max(-1, y1))
        x2 = Math.min(width, Math.max(-1, x2))
        y2 = Math.min(height, Math.max(-1, y2))
        ctx.strokeStyle = "rgb(192 220 255 / 0.2)"
        ctx.strokeRect(0, y1, canvas.width, y2 - y1)
        ctx.strokeStyle = "rgb(192 220 255 / 0.8)"
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
        ctx.fillStyle = "rgb(192 220 255 / 0.4)"
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
      }

      if (mouseTX.t >= 0) {
        m.seek(mouseTX.t)

        mouseOverInfo = {
          tape: m.tape,
          transition: m.peek()
        }
      }
    }
  }

  function draw(time: DOMHighResTimeStamp) {
    const dtime = Math.min(1000, time - prevTime) // Cap it to a second to prevent runaway slowdown at high animation speeds.
    const stepsPerMs = animateSpeed / 1000
    if (stepsPerMs !== 0) {
      const dsteps = Math.trunc(dtime * stepsPerMs)
      position.t = Math.max(0, Math.floor(position.t + dsteps))

      prevTime += Math.trunc((time - prevTime) * stepsPerMs) / stepsPerMs
    }
    if (animate) requestAnimationFrame(draw)
  }

  function updateMouse(e: MouseEvent) {
    mouseXY = { x: e.offsetX, y: e.offsetY }
  }

  onMount(() => {
    ctx = canvas.getContext("2d")
    offCanvas = new OffscreenCanvas(0, 0)
    offCtx = offCanvas.getContext("2d")!
    const h = Math.floor(height / scale)

    $effect(() => {
      m = new TuringMachine(machineInfo)
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
      renderMainCanvas()
    })

    $effect(() => {
      if (animate) {
        prevTime = performance.now()
        requestAnimationFrame(draw)
      }
    })
  })
</script>

{#snippet macroTransition(mt: MacroTransition)}
  <p id="macro-transition" class="text-center text-sm">
    <TapeSpan tape={mt.from} /> →[{mt.steps}] <TapeSpan tape={mt.to} />
  </p>
{/snippet}

<svelte:document
  onmousedown={(e) => {
    if (e.target !== canvas && !statusBar?.contains(e.target as Node)) analyzeMode = false
  }}
/>
<canvas
  id="explore-canvas"
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
        // Zoom, while adjusting t and x so that mouse is at the same cell as before
        const t = position.t + Math.floor(mouseXY.y / scale) - Math.floor(mouseXY.y / newScale)
        const x = position.x + Math.round((mouseXY.x - (canvasOffsetX() + width) / 2) * (1 / scale - 1 / newScale))
        position.x = x
        position.t = Math.max(0, t)
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
        scrollX(e.deltaX / 6000)
        scrollT(e.deltaY / 750)
      } else {
        if (e.shiftKey) scrollX(e.deltaY / 6000)
        else scrollT(e.deltaY / 750)
      }
    }
  }}
  onkeydown={(e) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        scrollT(-(2 ** (-3 + (e.shiftKey ? 2 : 0) + (e.ctrlKey || e.metaKey ? 2 : 0))))
        break
      case "ArrowDown":
        e.preventDefault()
        scrollT(2 ** (-3 + (e.shiftKey ? 2 : 0) + (e.ctrlKey || e.metaKey ? 2 : 0)))
        break
      case "ArrowLeft":
        e.preventDefault()
        scrollX(-(2 ** (-5 + (e.shiftKey ? 2 : 0) + (e.ctrlKey || e.metaKey ? 2 : 0))))
        break
      case "ArrowRight":
        e.preventDefault()
        scrollX(2 ** (-5 + (e.shiftKey ? 2 : 0) + (e.ctrlKey || e.metaKey ? 2 : 0)))
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
        e.preventDefault()
        position.x = position.t = 0
        break
      case "End":
        e.preventDefault()
        position.t = (m.snapshots.length - 1) * m.snapshotFrequency
        break
      case "0":
      case ")":
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) scale = 1
        else if (e.altKey) animateSpeed = 1
        else {
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
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) scale = Math.round(2 ** (Number(e.key).valueOf() / 2))
        else if (e.altKey) animateSpeed = 2 ** Number(e.key).valueOf()
        else {
          const baseSeek = 10
          position.t = baseSeek * 10 ** (e.key.charCodeAt(0) - "1".charCodeAt(0))
        }
        break
      case "j":
        e.preventDefault()
        position.x = m.tape.leftEdge
        break
      case "k":
        e.preventDefault()
        position.x = m.tape.head
        break
      case "l":
        e.preventDefault()
        position.x = m.tape.rightEdge
        break
      case "c":
        if (analyzeMode && (e.ctrlKey || e.metaKey) && mouseOverInfo != null && mouseTX.t >= 0) {
          e.preventDefault()
          // Copy tape contents
          const el = document.querySelector("#macro-transition")
          let copyText: string
          if (el == null || el.textContent == null) {
            m.seek(mouseTX.t)
            copyText = m.tape.toString()
          } else copyText = el.textContent
          navigator.clipboard.writeText(copyText).then(
            () => {
              console.log("Tape contents copied to clipboard.")
              copied = true
              setTimeout(() => {
                copied = false
              }, 1000)
            },
            (err) => {
              console.error("Could not copy tape contents: ", err)
            }
          )
        }
    }
  }}
  onmousedown={(e) => {
    if (e.button === 0) {
      analyzeMode = true
      if (selectionTX.start != null && selectionTX.end == null) selectionTX.end = mouseTX
      else if (e.shiftKey) {
        selectionTX.start = mouseTX
        selectionTX.end = undefined
      } else {
        selectionTX.start = undefined
        selectionTX.end = undefined
      }
      updateMouse(e)
      renderMainCanvas()
    }
  }}
  onmousemove={(e) => {
    updateMouse(e)
    if (analyzeMode) renderMainCanvas()
  }}
></canvas>
{#if debug}
  <div>
    Rendering time {renderTime.toFixed(2)} ms | {((renderTime * 1000000 * scale * scale) / (width * height)).toFixed(0)}
    ns per pixel | {mouseXY.x}, {mouseXY.y}
  </div>
{/if}
<div
  class="fixed bottom-0 left-0 right-0 text-nowrap rounded-md border bg-slate-200 px-2 py-1 font-mono text-xs dark:bg-slate-900 {analyzeMode
    ? ''
    : 'hidden'}"
  bind:this={statusBar}
>
  {#if selectionRectTX == null}
    <h3 class="my-1 text-center text-base font-bold">
      <div>({mouseTX.t}, {mouseTX.x})</div>
      <StateSpan state={mouseOverInfo.tape.state} />{mouseOverInfo.tape.value}
      {#if mouseOverInfo.transition != null}
        → {mouseOverInfo.transition.symbol}{mouseOverInfo.transition.direction === 1 ? "R" : "L"}<StateSpan
          state={mouseOverInfo.transition.toState}
        />
      {/if}
    </h3>
    <div class="mb-1 grid grid-cols-[auto_auto] gap-x-4">
      <div class="text-right font-semibold">Tape</div>
      <div class="truncate">
        <TapeSpan
          tape={mouseOverInfo.tape.getSegment(
            mouseOverInfo.tape.leftEdge,
            Math.min(mouseOverInfo.tape.leftEdge + 150, mouseOverInfo.tape.rightEdge)
          )}
        />
      </div>
      <div class="text-right font-semibold">Tape extent</div>
      <div>
        [{mouseOverInfo.tape.leftEdge}, {mouseOverInfo.tape.rightEdge}] (size = {mouseOverInfo.tape.size})
      </div>
      <div class="text-right font-semibold">Head</div>
      <div>{mouseOverInfo.tape.head}</div>
      <div class="text-right font-semibold">Symbol under mouse</div>
      <div>{mouseOverInfo.tape.at(mouseTX.x)}</div>
    </div>
  {:else}
    <h3 class="my-1 text-center text-base font-bold">
      <div>
        ({selectionRectTX.t}, {selectionRectTX.x}) &rightarrow; ({selectionRectTX.t + selectionRectTX.h - 1}, {selectionRectTX.x +
          selectionRectTX.w -
          1}) <span class="text-gray-300 dark:text-gray-800">|</span> h = {selectionRectTX.h}, w = {selectionRectTX.w}
      </div>
    </h3>
    <div>
      {@render macroTransition(m.getMacroTransition(selectionRectTX.t, selectionRectTX.t + selectionRectTX.h))}
    </div>
  {/if}
  {#if copied}
    <div class="absolute bottom-1 right-1 flex items-center"><Copy /><Check color="green" /></div>
  {/if}
</div>
