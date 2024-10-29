<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { formatTMRule, parseTMRule, type TMRule } from "../../turing"

  let code = $state($page.params.code ?? "")
  let result = $derived.by(() => {
    const rule = parseTMRule(code)
    if (rule.length === 0) return []
    const n = rule.length
    return allPermutations(n)
      .map((perm) => {
        return { perm, s: formatTMRule(applyPerm(perm, rule)) }
      })
      .filter(({ s }) => s.startsWith("1RB") || s.startsWith("1LB"))
      .map(({ perm, s }) => {
        return { perm, s: s.startsWith("1LB") ? s.replaceAll("L", "+").replaceAll("R", "L").replaceAll("+", "R") : s }
      })
      .filter(({ s }) => isLNF(parseTMRule(s)))
  })

  function isLNF(rule: TMRule) {
    const t = rule[0][0]
    if (t.symbol !== 1 || t.direction !== 1 || t.toState !== 1) return false
    let hSymbol = 1
    let hState = 1
    for (let i = 0; i < rule.length; ++i) {
      for (let j = 0; j < rule[i].length; ++j) {
        if (rule[i][j].symbol > hSymbol + 1 || rule[i][j].toState > hState + 1) return false
        hSymbol = Math.max(hSymbol, rule[i][j].symbol)
        hState = Math.max(hState, rule[i][j].toState)
      }
    }
    return true
  }

  function* allPermutations(n: number): Generator<number[]> {
    if (n === 0) {
      yield []
      return
    }
    for (let i = 0; i < n; ++i) {
      for (const perm of allPermutations(n - 1)) {
        yield [i, ...perm.map((j) => (j >= i ? j + 1 : j))]
      }
    }
  }

  function applyPerm(perm: number[], rule: TMRule): TMRule {
    let res: TMRule = Array(rule.length).fill(Array(rule[0].length))
    for (let i = 0; i < perm.length; ++i)
      res[perm[i]] = rule[i].map((tr) => ({
        ...tr,
        toState: tr.toState >= 0 && tr.toState < rule.length ? perm[tr.toState] : -1
      }))
    return res
  }
</script>

<svelte:head>
  <title>Permutation checker</title>
  <meta name="description" content="Tool to check permutations of a Turing machine rule." />
</svelte:head>
<div class="flex flex-row items-center gap-x-2 self-center">
  <Label for="code" class="text-nowrap"
    >Code in <a
      class="text-cyan-500 hover:underline"
      href="https://discuss.bbchallenge.org/t/standard-tm-text-format/60"
      target="_blank">standard format</a
    >:</Label
  >
  <Input
    id="code"
    class="w-96 font-mono text-sm invalid:focus:ring-red-500"
    autocomplete="off"
    spellcheck="false"
    bind:value={code}
    oninput={(e) => {
      const parsed = parseTMRule(e.currentTarget.value)
      if (parsed.length === 0) {
        e.currentTarget.setCustomValidity("Invalid code")
      } else {
        e.currentTarget.setCustomValidity("")
        goto(`/turing/permutations/${formatTMRule(parsed)}`, { keepFocus: true })
      }
    }}
  />
</div>
<div class="self-center">
  {#each result as { perm, s }}
    <div>
      {perm} <span class="font-mono text-sm">{s}</span> &bullet;
      <a href="/turing/{s}" class="text-cyan-500 hover:underline">Overview</a> &bullet;
      <a href="/turing/explore/{s}" class="text-cyan-500 hover:underline">Explore</a>
    </div>
  {/each}
</div>
