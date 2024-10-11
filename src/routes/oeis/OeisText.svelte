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

  function hasScope(token: ThemedToken, scope: string) {
    if (token.explanation == null || token.explanation.length == 0) return false
    return token.explanation[0].scopes.some((s) => s.scopeName === scope)
  }

  function getStyle(token: ThemedToken & { scope: string }) {
    if (token.explanation == null || token.explanation.length == 0) return ""

    let res = `color: ${token.color};`
    if (token.content === "∑" || token.content === "∏" || token.content === "∫") res += "font-size: 1.5rem;"

    // Exponents/subscripts
    let offset = 0
    let fontSize = 100
    let fontWeight = 500
    let fac = 6
    let isSqrtSymbol = false
    let isSqrtContent = false
    for (let { scopeName } of token.explanation[0].scopes) {
      if (scopeName.includes("hidden")) return "font-size: 0;"
      if (scopeName.includes("exponent.content")) {
        offset += fac
        fontSize /= 1.15
        fac /= 1.15
      } else if (scopeName.includes("subscript.content")) {
        offset -= fac
        fontSize /= 1.2
        fac /= 1.15
      } else if (scopeName.includes("sqrt.symbol")) {
        isSqrtSymbol = true
      } else if (scopeName.includes("sqrt.content")) {
        isSqrtContent = true
      } else if (scopeName.match(/(?:floor|ceiling).(?:begin|end)/)) {
        fontSize *= 1.4
      }
    }
    if (isSqrtSymbol) {
      fontSize *= 1.45
      fontWeight = 100
      res += "margin-right: -0.2rem;"
    } else if (isSqrtContent) res += "text-decoration: overline; text-decoration-color: var(--sqrt);"
    fontSize = Math.max(50, fontSize)
    if (fontSize !== 100) res += `font-size: ${fontSize}%;`
    if (fontWeight !== 500) res += `font-weight: ${fontWeight};`
    if (fac !== 6) {
      res += `position: relative; bottom: ${offset}px;`
    }

    return res
  }
</script>

{#snippet binom(items: any[])}
  <span class="inline-flex items-center text-[--binomial]">
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
  {#each tokens as line}
    <div>
      {#each line.map((token) => ({ ...token, scope: getScope(token) })) as token}
        <span style={getStyle(token)}>
          {#if token.scope === "anumber"}
            <OeisLink anumber={token.content} />
          {:else if token.scope === "author.content"}
            <a href="https://oeis.org/wiki/User:{token.content.replaceAll(' ', '_')}" target="_blank">{token.content}</a
            >
          {:else if token.scope === "binomial"}
            {@render binom(
              token.content.substring(token.content.indexOf("(") + 1, token.content.length - 1).split(",")
            )}
          {:else if hasScope(token, "floor.begin")}
            {"⌊".repeat(token.content.length / 6)}
          {:else if hasScope(token, "floor.end")}
            {"⌋".repeat(token.content.length)}
          {:else if hasScope(token, "ceiling.begin")}
            {"⌈".repeat(token.content.length / 8)}
          {:else if hasScope(token, "ceiling.end")}
            {"⌉".repeat(token.content.length)}
          {:else}
            {token.content}
          {/if}
        </span>
      {/each}
    </div>
  {/each}
{/if}
