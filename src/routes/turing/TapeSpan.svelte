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
    <span class="ring-1" style="--tw-ring-color: {getTmStateColorCss(tape.state, $mode)}">&lt;</span>{tape.data.join(
      ""
    )}
  {:else if tape.head === tape.data.length}
    {tape.data.join("")}<span class="ring-1" style="--tw-ring-color: {getTmStateColorCss(tape.state, $mode)}">&gt;</span
    >
  {:else}
    {tape.data.slice(0, tape.head).join("")}<span class="sr-only">&gt;</span><span
      class="ring-1"
      style="--tw-ring-color: {getTmStateColorCss(tape.state, $mode)}">{tape.data[tape.head]}</span
    >{tape.data.slice(tape.head + 1).join("")}
  {/if}
</span>
