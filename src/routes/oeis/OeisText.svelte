<script lang="ts">
  import { tokenize } from "./highlight"
  import OeisLink from "../oeis/OeisLink.svelte"
  import type { ThemedToken } from "shiki"

  interface Props {
    text: string
  }
  let { text }: Props = $props()
  let rendered = $state(false)
  let tokens: ThemedToken[][] = $state([])
  $effect(() => {
    if (text) {
      rendered = false
      setTimeout(async () => {
        tokens = await tokenize(text)
        rendered = true
      }, 0)
    }
  })

  function getScope(token: ThemedToken) {
    if (token.explanation == null) return ""
    let e = token.explanation[0]
    return e.scopes[e.scopes.length - 1].scopeName
  }

  function getStyle(token: ThemedToken & { scope: string }) {
    if (token.explanation == null || token.explanation.length == 0) return ""
    if (token.scope === "hidden") return "font-size: 0;"

    let res = `color: ${token.color};`
    if (token.scope === "sqrt.constant.symbol") res += "font-size: 1.25rem; font-weight: 100; margin-right: -0.25rem;"
    else if (token.scope === "sqrt.constant.content") res += "text-decoration: overline;"
    if (token.content === "∑" || token.content === "∏" || token.content === "∫") res += "font-size: 1.5rem;"

    // Exponents/subscripts
    let offset = 0
    let fontSize = 100
    let fac = 6
    for (let { scopeName } of token.explanation[0].scopes) {
      if (scopeName.includes("exponent.content")) {
        offset += fac
        fontSize /= 1.15
        fac /= 1.15
      } else if (scopeName.includes("subscript.content")) {
        offset -= fac
        fontSize /= 1.2
        fac /= 1.15
      }
    }
    fontSize = Math.max(50, fontSize)
    if (fac != 6) {
      res += `position: relative; bottom: ${offset}px; font-size: ${fontSize}%`
    }
    return res
  }
</script>

{#snippet binom(items: any[])}
  <span class="inline-flex items-center text-[--foreground]">
    <span class="text-xl font-thin">(</span>
    <span class="inline-flex flex-col items-center">
      <span class="text-xs">{items[0].trim()}</span>
      <span class="text-xs">{items.slice(1).join(",").trim()}</span>
    </span>
    <span class="text-xl font-thin">)</span>
  </span>
{/snippet}

<!-- TODO: Handle binomial coefficients properly. -->
{#if !rendered}
  {text}
{:else}
  <div>
    {#each tokens as line}
      {#each line.map((token) => ({ ...token, scope: getScope(token) })) as token}
        {#if token.scope === "anumber"}
          <OeisLink anumber={token.content} />
        {:else if token.scope === "author.content"}
          <a href="https://oeis.org/wiki/User:{token.content.replaceAll(' ', '_')}" target="_blank">{token.content}</a>
        {:else if token.scope === "binomial"}
          {@render binom(token.content.substring(token.content.indexOf("(") + 1, token.content.length - 1).split(","))}
        {:else}
          <span style={getStyle(token)}>{token.content}</span>
        {/if}
      {/each}
    {/each}
  </div>
{/if}
