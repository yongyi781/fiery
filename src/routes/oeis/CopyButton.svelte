<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Check, Copy } from "@lucide/svelte"

  interface Props {
    text: string
    size?: string | number
  }

  let { text, size }: Props = $props()
  let copied = $state(false)

  // Reset copied on text change.
  $effect(() => {
    if (text) {
      copied = false
    }
  })

  async function copy() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      copied = true
    }
  }
</script>

{#if navigator.clipboard != null}
  <Button variant="ghost" size="sm" onclick={copy}>
    {#if copied}
      <Check color="green" {size} />
    {:else}
      <Copy {size} />
    {/if}
  </Button>
{/if}
