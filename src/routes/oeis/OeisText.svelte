<script lang="ts">
  import OeisLink from "./OeisLink.svelte"

  interface Props {
    text: string
  }

  function toExact(regex: RegExp) {
    return new RegExp("^" + regex.source + "$")
  }

  function extractAuthor(s: string) {
    return s.substring(s.indexOf("_") + 1, s.length - 1)
  }

  const regexes = {
    author: /(?: |^)_.+?_/,
    exponent: /\^(?:\d+|\w\b)/,
    subscript: /_(?:\d+|\w\b)/,
    sqrt: /\bsqrt\(\d+?\)/,
    arrow: /-+>|=+>/,
    operator: /[+\-*/^[\](){}](?! _)|(?<![<>!]):?=/,
    summation: /Sum_{.+?}/,
    product: /Product_{.+?}/,
    integral: /Integral_{.+?}/,
    anumber: /A\d{6}/,
    rest: /\b[a-zA-Z]+\b|>=|<=/
  }
  let exactRegexes: { [key: string]: RegExp } = {}
  for (const [key, value] of Object.entries(regexes)) {
    exactRegexes[key] = toExact(value)
  }
  const splitRegex = new RegExp(
    "(" +
      Object.values(regexes)
        .map((r) => r.source)
        .join("|") +
      ")"
  )
  const operatorColors: { [key: string]: string } = {
    "+": "text-green-600 dark:text-green-400",
    "-": "text-red-600 dark:text-red-500",
    "*": "text-blue-600 dark:text-blue-400",
    "/": "text-yellow-700",
    "^": "text-purple-600 dark:text-purple-400",
    "=": "text-pink-600 dark:text-[#fea4bf]",
    ":=": "text-pink-600 dark:text-[#fea4bf]",
    "(": "text-yellow-600 dark:text-yellow-500",
    ")": "text-yellow-600 dark:text-yellow-500",
    "[": "text-yellow-500 dark:text-yellow-400",
    "]": "text-yellow-500 dark:text-yellow-400",
    "{": "text-cyan-500",
    "}": "text-cyan-500"
  }
  const mathReplacements: { [key: string]: string } = {
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    Delta: "Δ",
    epsilon: "ε",
    zeta: "ζ",
    eta: "η",
    theta: "θ",
    Theta: "Θ",
    iota: "ι",
    kappa: "κ",
    lambda: "λ",
    Lambda: "Λ",
    mu: "μ",
    nu: "ν",
    xi: "ξ",
    pi: "π",
    Pi: "π", // OEIS likes to use Pi for pi.
    rho: "ρ",
    sigma: "σ",
    tau: "τ",
    phi: "φ",
    Phi: "Φ",
    chi: "χ",
    psi: "ψ",
    Psi: "Ψ",
    omega: "ω",
    Omega: "Ω",
    sqrt: "√",
    "<=": "≤",
    ">=": "≥"
  }

  let { text }: Props = $props()
  let rendered = $state(false)
  let tokens: string[] = $state([text])
  $effect(() => {
    if (text) {
      rendered = false
      setTimeout(() => {
        tokens = text.split(splitRegex).filter((s) => s.length > 0)
        rendered = true
      }, 0)
    }
  })
</script>

{#if !rendered}
  <div>{text}</div>
{:else}
  <div>
    {#each tokens as token}
      {#if token.match(exactRegexes.anumber)}
        <OeisLink anumber={token} />
      {:else if token.match(exactRegexes.author)}
        {#if token.startsWith(" ")}&nbsp;{/if}<a
          href="https://oeis.org/wiki/User:{extractAuthor(token).replaceAll(' ', '_')}"
          target="_blank">{extractAuthor(token)}</a
        >
      {:else if token.match(exactRegexes.exponent)}
        <span class="text-[0]">^</span><sup>{token.substring(1)}</sup>
      {:else if token.match(exactRegexes.subscript)}
        <span class="text-[0]">_</span><sub>{token.substring(1)}</sub>
      {:else if token.match(exactRegexes.sqrt)}
        <span class="-mr-1 text-xl font-thin">√</span><span class="overline"
          >{token.substring(5, token.length - 1)}</span
        >
      {:else if token.match(exactRegexes.operator)}
        <span class={operatorColors[token]}>{token}</span>
      {:else if token.match(exactRegexes.summation)}
        <span class={"relative top-0.5 text-2xl " + operatorColors["*"]}>&Sigma;</span><sub class="top-1"
          >{token.substring(5, token.length - 1)}</sub
        >
      {:else if token.match(exactRegexes.product)}
        <span class={"text-2xl " + operatorColors["^"]}>&Product;</span><sub class="top-1"
          >{token.substring(9, token.length - 1)}</sub
        >
      {:else if token.match(exactRegexes.integral)}
        <span class={"text-2xl " + operatorColors["*"]}>&Integral;</span><sub class="top-1"
          >{token.substring(10, token.length - 1)}</sub
        >
      {:else if token in mathReplacements}
        {mathReplacements[token]}
      {:else}
        {token}
      {/if}
    {/each}
  </div>
{/if}
