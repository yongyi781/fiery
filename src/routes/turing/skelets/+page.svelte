<script lang="ts">
  import { skelets } from "../machines"
  import Overview from "../Overview.svelte"
  import { parseTMRule } from "../turing"
  import { page } from "$app/stores"
</script>

<div class="flex flex-wrap gap-1">
  {#each skelets as skelet, i}
    <div class="border border-slate-800 text-center">
      <a href="/turing/{skelet}">
        <Overview
          rule={parseTMRule(skelet)}
          width={128}
          height={128}
          numSteps={Number($page.url.searchParams.get("n")).valueOf() || 65536}
          quality={Number($page.url.searchParams.get("q")).valueOf() || 2}
        />
        <div class="bg-slate-200 dark:bg-slate-900">{i + 1}</div>
      </a>
    </div>
  {/each}
</div>
