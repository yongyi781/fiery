<script lang="ts">
  import * as HoverCard from "$lib/components/ui/hover-card"
  import OeisText from "./OeisText.svelte"

  interface Props {
    anumber: string
  }

  let { anumber }: Props = $props()
  let response: Response | undefined = $state()
  let obj: any = $state()

  async function onChange(open: boolean) {
    if (open && response == null) {
      let url = `/oeis/api/${anumber}`
      response = await fetch(url)
      if (response.ok) obj = await response.json()
    }
  }

  $effect(() => {
    if (anumber) {
      response = undefined
      obj = undefined
    }
  })
</script>

<HoverCard.Root openDelay={100} closeDelay={400} onOpenChange={onChange}>
  <HoverCard.Trigger href="/oeis?q=id:{anumber}" target="_blank" class="anumber">{anumber}</HoverCard.Trigger
  ><HoverCard.Content class="flex w-96 flex-col">
    {#if response == null || obj == null}
      Loading…
    {:else if !response.ok}
      <div class="text-red-500">{response.statusText}</div>
    {:else}
      <h3 class="mb-3 text-xl font-bold">A{obj.number.toString().padStart(6, "0")}</h3>
      <OeisText text={obj.name} />
      <div class="mt-3 overflow-hidden text-ellipsis font-mono text-sm">{obj.data}</div>
    {/if}
  </HoverCard.Content>
</HoverCard.Root>
