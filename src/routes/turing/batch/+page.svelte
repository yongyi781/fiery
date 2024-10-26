<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable"
  import { Textarea } from "$lib/components/ui/textarea"
  import { localStore } from "$lib/local-store.svelte"
  import Overview from "../Overview.svelte"
  import { parseTMRule, TuringMachine } from "../turing"

  let input = localStore("batch-turing-input", "")
  let validInputs = $derived(new Set(input.value.split("\n").filter((s) => parseTMRule(s).length > 0)))
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
      rows={40}
      placeholder="Enter Turing machine rules here, one per line"
      autocomplete="on"
      spellcheck="false"
      bind:value={input.value}
    />
  </Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane class="relative">
    <div class="absolute h-full w-full overflow-y-auto px-4 py-2">
      <ol class="flex flex-row flex-wrap gap-1">
        {#each validInputs as s, i (s)}
          <li class="ml-4 text-center">
            <a href="/turing/{s}">
              <Overview machine={new TuringMachine(parseTMRule(s))} width={128} height={128} />
              <div class="bg-slate-200 dark:bg-slate-900">{i + 1}</div>
            </a>
          </li>
        {/each}
      </ol>
    </div>
  </Resizable.Pane>
</Resizable.PaneGroup>
