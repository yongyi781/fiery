<script lang="ts">
  import { page } from "$app/stores"
  import Permutations from "./Permutations.svelte"
  import type { TMRule } from "./turing"

  let { rule }: { rule: TMRule } = $props()
</script>

<div class="mt-6 flex flex-col flex-wrap justify-center lg:flex-row">
  <div class="m-2 rounded-sm border bg-slate-900/50 p-4">
    <h1 class="text-3xl font-bold">See also</h1>
    <ul class="ml-8 list-disc">
      <li><a href="/turing/skelets" class="text-cyan-500 hover:underline">The 43 Skelets</a></li>
      <li>
        <a href="/turing/bb6random" class="text-cyan-500 hover:underline">Random BB(6) holdout</a> (as of 2024/10/19)
      </li>
      <li><a href="/turing/batch" class="text-cyan-500 hover:underline">Batch Turing machine visualizer</a></li>
    </ul>
  </div>
  <div class="m-2 rounded-sm border bg-slate-900/50 p-4">
    <h1 class="text-3xl font-bold">Collections</h1>
    <ul class="ml-8 list-disc">
      <!-- Hard-coded so user does not have to download huge collections file... -->
      {#each ["skelets", "2", "3", "4-tcyclers", "4-spaghettis", "bb6-holdouts"] as key}
        <li><a href="/turing/batch/{key}" class="text-cyan-500 hover:underline">{key}</a></li>
      {/each}
    </ul>
    <p>Note: bb6-holdouts will take about 20 seconds to load.</p>
  </div>
  <div class="m-2 rounded-sm border bg-slate-900/50 p-4">
    <h1 class="text-3xl font-bold">Permutations</h1>
    <Permutations {rule} />
  </div>
</div>
