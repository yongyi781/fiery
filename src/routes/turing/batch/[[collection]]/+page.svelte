<script lang="ts">
  import { page } from "$app/stores"
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js"
  import * as Resizable from "$lib/components/ui/resizable"
  import { Textarea } from "$lib/components/ui/textarea"
  import { localStore } from "$lib/local-store.svelte"
  import { Copy, Trash2 } from "lucide-svelte"
  import Overview from "../../Overview.svelte"
  import { parseTMRule, rulesEqual } from "../../turing"

  const { data } = $props()

  // svelte-ignore non_reactive_update
  let input: { value: string }
  if (data.collection != null) input = { value: data.collection.join("\n") }
  else input = localStore("batch-turing-input", "")
  const size = Number($page.url.searchParams.get("size")).valueOf() || 128
  const numSteps = $page.url.searchParams.has("n") ? Number($page.url.searchParams.get("n")).valueOf() || 0 : 16384
  const quality = Number($page.url.searchParams.get("q")).valueOf() || 1
  let validInputs = $derived(new Set(input.value.split("\n").filter((s) => parseTMRule(s).length > 0)))

  function bitFloor(n: number) {
    if (!(n & (n - 1))) return n
    return 1 << (n.toString(2).length - 1)
  }
</script>

<svelte:head>
  <title>Batch Turing Machine Visualizer</title>
  <meta name="description" content="High performance batch Turing machine visualizer." />
</svelte:head>

<Resizable.PaneGroup direction="horizontal">
  <Resizable.Pane class="relative" defaultSize={33}>
    <Textarea
      id="code"
      class="h-full w-full font-mono text-sm"
      placeholder="Enter Turing machine rules here, one per line"
      autocomplete="on"
      spellcheck="false"
      readonly={data.collection != null}
      bind:value={input.value}
    />
  </Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane class="relative">
    <div class="absolute h-full w-full overflow-y-auto px-4 py-2">
      <ol class="flex flex-row flex-wrap gap-1">
        {#each validInputs as s, i (s)}
          <li class="mx-1 text-center">
            <ContextMenu.Root>
              <ContextMenu.Trigger>
                <a href="/turing/{s}">
                  <Overview machineInfo={{ rule: parseTMRule(s) }} width={size} height={size} {numSteps} {quality} />
                  <div class="bg-slate-200 dark:bg-slate-900">{i + 1}</div>
                </a>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Item
                  onclick={() => {
                    navigator.clipboard.writeText(s).catch((err) => {
                      console.error("Failed to copy: ", err)
                    })
                  }}><Copy size="16" class="mr-2" />Copy code</ContextMenu.Item
                >
                {#if data.collection == null}
                  <ContextMenu.Item
                    onclick={() => {
                      input.value = input.value
                        .split("\n")
                        .filter((t) => !rulesEqual(parseTMRule(t), parseTMRule(s)))
                        .join("\n")
                    }}><Trash2 size="16" class="mr-2" /> Delete</ContextMenu.Item
                  >
                {/if}
              </ContextMenu.Content>
            </ContextMenu.Root>
          </li>
        {/each}
      </ol>
    </div>
  </Resizable.Pane>
</Resizable.PaneGroup>
