<script lang="ts">
  interface Props {
    data: bigint[]
    offset: number
  }

  let { data, offset }: Props = $props()
  let n = $derived(Math.ceil((-1 + Math.sqrt(1 + 8 * data.length)) / 2))
</script>

<div class="mt-3 flex flex-col text-center">
  <h4 class="font-bold">Triangle ({n} rows)</h4>
  <table class="font-mono text-sm">
    <thead>
      <tr>
        <th class="select-none px-1.5 text-xs text-gray-400">n\k</th>
        {#each Array(n) as _, i}
          <th class="select-none px-1.5 text-xs text-gray-400">{i + offset}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each Array(n) as _, i}
        <tr class="text-center">
          <td class="select-none px-1.5 text-xs text-gray-400">{i + offset}</td>
          {#each data.slice((i * (i + 1)) / 2, ((i + 1) * (i + 2)) / 2) as x}
            <td class="px-1.5">{x}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
