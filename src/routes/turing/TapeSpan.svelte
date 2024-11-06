<script lang="ts">
  import StateSpan from "./StateSpan.svelte"
  import { type TapeSegment } from "./turing"

  interface Props {
    tape: TapeSegment
  }

  let { tape }: Props = $props()
</script>

<span>
  <StateSpan state={tape.state} />
  {#if tape.head === -1}
    <span class="ring-1 ring-black dark:ring-white">&lt;</span>{tape.data.join("")}
  {:else if tape.head === tape.data.length}
    {tape.data.join("")}<span class="ring-1 ring-black dark:ring-white">&gt;</span>
  {:else}
    {tape.data.slice(0, tape.head).join("")}<span class="sr-only">&gt;</span><span
      class="ring-1 ring-black dark:ring-white">{tape.data[tape.head]}</span
    >{tape.data.slice(tape.head + 1).join("")}
  {/if}
</span>
