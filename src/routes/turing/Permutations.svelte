<script lang="ts">
  import { formatTMRule, parseTMRule, type TMRule } from "./turing"

  let { rule }: { rule: TMRule } = $props()

  let result = $derived.by(() => {
    if (rule.length === 0) return []
    const n = rule.length
    return allPermutations(n)
      .drop(1) // Ignore identity permutation
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

<ul class="ml-6 list-disc">
  {#each result as { perm, s }}
    <li>
      {perm} <span class="font-mono text-sm">{s}</span> &bullet;
      <a href="/turing/{s}" class="text-cyan-500 hover:underline">Overview</a> &bullet;
      <a href="/turing/explore/{s}" class="text-cyan-500 hover:underline">Explore</a>
    </li>
  {/each}
</ul>
