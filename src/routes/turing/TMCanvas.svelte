<script lang="ts">
  import { onMount, untrack } from "svelte"
  import { getTmStateColor, getTmSymbolColor, TuringMachine, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
    cellSize?: number
    height?: number
    startStep?: number
    animate?: boolean
    animateSpeed?: number
  }

  let {
    rule,
    cellSize = $bindable(8),
    height = 5000,
    startStep = $bindable(0),
    animate = $bindable(false),
    animateSpeed = $bindable(1)
  }: Props = $props()

  let canvas: HTMLCanvasElement | undefined = $state()
  let m = new TuringMachine($state.snapshot(rule))
  let renderTime = $state(0)

  function numSteps() {
    return Math.floor(height / cellSize)
  }

  function scroll(dir: number) {
    startStep = Math.max(0, startStep + Math.round(dir * numSteps()))
  }

  onMount(() => {
    if (canvas == null) return
    const ctx = canvas.getContext("2d")!

    function render() {
      if (canvas == null || height <= 0 || startStep < 0) return
      let now = performance.now()
      m.seek(startStep)

      // Run it once to get how wide the canvas should be
      const n = numSteps()
      m.seek(startStep + n)
      const offset = -m.tape.leftEdge

      const offCanvas = new OffscreenCanvas(m.tape.size + 1, n)
      const offCtx = offCanvas.getContext("2d")!
      offCtx.imageSmoothingEnabled = false
      offCtx.globalCompositeOperation = "copy"

      // Now render
      m.seek(startStep)
      const imageData = offCtx.createImageData(offCanvas.width, offCanvas.height)
      const nSymbols = rule[0].length
      const offCanvasWidth = offCanvas.width
      for (let i = 0; i < n; ++i) {
        if (!m.step()) break
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
      }
      offCtx.putImageData(imageData, 0, 0)

      canvas.width = offCanvas.width * cellSize
      canvas.height = offCanvas.height * cellSize
      ctx.imageSmoothingEnabled = false
      ctx.globalCompositeOperation = "copy"
      ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height)

      renderTime = performance.now() - now
    }

    $effect(() => {
      m = new TuringMachine($state.snapshot(rule))
      untrack(() => render())
    })

    $effect(() => {
      ctx.scale(cellSize, cellSize)
    })

    $effect(() => {
      render()
    })
  })
</script>

<div class="flex w-svw flex-col gap-y-3 p-4">
  <div class="relative overflow-auto">
    <canvas
      id="canvas"
      class="border-grey-200 mx-auto border"
      width="1"
      height="1"
      tabindex="0"
      bind:this={canvas}
      onwheel={(e) => {
        if (e.shiftKey) return
        if (e.ctrlKey) {
          e.preventDefault()
          if (e.deltaY < 0) ++cellSize
          else if (e.deltaY > 0 && cellSize > 1) --cellSize
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
    ></canvas>
  </div>
  <div class="self-center">
    Rendering time {renderTime.toFixed(2)} ms | {(
      (renderTime * 1000000 * cellSize * cellSize) /
      (canvas?.width * canvas?.height)
    ).toFixed(0)}
    ns per pixel
  </div>
</div>
