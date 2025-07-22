<script lang="ts">
  import Permutations from "./Permutations.svelte"
  import type { TMRule } from "./turing"

  let { rule }: { rule: TMRule } = $props()

  const keys = [
    "skelets",
    "2-non-tcyclers",
    "3-bouncers",
    "3-counters",
    "3-bells",
    "4-tcyclers",
    "4-hard-bouncers",
    "4-bells",
    "4-counters",
    "4-bouncer+x",
    "4-bounce-counters",
    "4-cubic-bounce-counters",
    "4-fractals",
    "4-tetration-counters",
    "4-irregular-bells",
    "4-chaotic-counters",
    "4-spaghettis",
    "bb6-holdouts"
  ]
</script>

<div class="mt-6 flex flex-col flex-wrap justify-center lg:flex-row">
  <div class="m-2 rounded-sm border bg-slate-100/50 p-4 dark:bg-slate-900/50">
    <h1 class="text-3xl font-bold">See also</h1>
    <ul class="ml-8 list-disc">
      <li><a href="/turing/skelets" class="text-cyan-500 hover:underline">The 43 Skelets</a></li>
      <li>
        <a href="/turing/bb6random" class="text-cyan-500 hover:underline">Random BB(6) holdout</a> (as of July 2025)
      </li>
      <li><a href="/turing/batch" class="text-cyan-500 hover:underline">Batch Turing machine visualizer</a></li>
    </ul>
  </div>
  <div class="m-2 rounded-sm border bg-slate-100/50 p-4 dark:bg-slate-900/50">
    <h1 class="text-3xl font-bold">Collections</h1>
    <ul class="ml-8 list-disc">
      <!-- Hard-coded so user does not have to download huge collections file... -->
      {#each keys as key}
        <li><a href="/turing/batch/{key}" class="text-cyan-500 hover:underline">{key}</a></li>
      {/each}
    </ul>
    <p>Note: bb6-holdouts will take about 20 seconds to load.</p>
  </div>
  {#if rule.length <= 6}
    <!-- Don't calculate permutations with greater than 8 states -->
    <Permutations {rule} />
  {/if}
</div>
