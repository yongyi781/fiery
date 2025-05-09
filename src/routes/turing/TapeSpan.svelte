<script lang="ts">
  import { mode } from "mode-watcher"
  import StateSpan from "./StateSpan.svelte"
  import { getTmStateColorCss, type TapeSegment } from "./turing"

  interface Props {
    tape: TapeSegment
  }

  let { tape }: Props = $props()
</script>

<span>
  <StateSpan state={tape.state} />
  {#if tape.head < -1 || tape.head > tape.data.length}
    {tape.data.join("")}
  {:else if tape.head === -1}
    <span class="ring-1" style="--tw-ring-color: {getTmStateColorCss(tape.state, mode.current)}">&lt;</span
    >{tape.data.join("")}
  {:else if tape.head === tape.data.length}
    {tape.data.join("")}<span class="ring-1" style="--tw-ring-color: {getTmStateColorCss(tape.state, mode.current)}"
      >&gt;</span
    >
  {:else}
    <span>{tape.data.slice(0, tape.head).join("")}</span><span class="text-[0] leading-none">&gt;</span><span
      class="ring-1"
      style="--tw-ring-color: {getTmStateColorCss(tape.state, mode.current)}">{tape.data[tape.head]}</span
    ><span>{tape.data.slice(tape.head + 1).join("")}</span>
  {/if}
</span>
