<script lang="ts">
  import { formatTMRule, parseTMRule, stateToString, type TMRule } from "./turing"

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

  function allPermutations(n: number): number[][] {
    if (n === 0) {
      return [[]]
    }
    let res = []
    for (let i = 0; i < n; ++i) {
      for (const perm of allPermutations(n - 1)) {
        res.push([i, ...perm.map((j) => (j >= i ? j + 1 : j))])
      }
    }
    return res
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

  let { rule }: { rule: TMRule } = $props()

  // TODO: permute symbols too
  let result = $derived.by(() => {
    if (rule.length === 0) return []
    const n = rule.length
    return allPermutations(n)
      .slice(1)
      .map((perm) => {
        return { perm, s: formatTMRule(applyPerm(perm, rule)) }
      })
      .filter(({ s }) => s.startsWith("1RB") || s.startsWith("1LB"))
      .map(({ perm, s }) => {
        return {
          perm: perm.map((i) => stateToString(i)).join(""),
          s: s.startsWith("1LB") ? s.replaceAll("L", "+").replaceAll("R", "L").replaceAll("+", "R") : s
        }
      })
      .filter(({ s }) => isLNF(parseTMRule(s)))
  })
</script>

<ul class="ml-6 list-disc">
  {#each result as { perm, s }}
    <li>
      {perm} &bullet;
      <a href="/turing/{s}" class="font-mono text-sm text-cyan-500 hover:underline" data-sveltekit-noscroll>{s}</a>
    </li>
  {/each}
</ul>
