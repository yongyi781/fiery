<script lang="ts">
  import { mode } from "mode-watcher"
  import { getTmStateColorCss, stateToString, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
  }

  let { rule = $bindable() }: Props = $props()
  function numSymbols() {
    return rule.length === 0 ? 0 : rule[0].length
  }
</script>

<div class="mx-auto font-mono text-sm">
  {#each rule as row, i}
    <div>
      {#each row as tr, j}
        <span style="color: {getTmStateColorCss(i, $mode)};">{stateToString(i)}{j}</span>
        →
        <input
          type="number"
          bind:value={tr.symbol}
          class="no-arrows w-5 border border-blue-200 bg-transparent py-1 text-center outline-none [appearance:textfield] dark:border-blue-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          maxlength="1"
          autocomplete="off"
          spellcheck="false"
          onkeydown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowRight") {
              e.preventDefault()
              tr.symbol = (tr.symbol + 1) % numSymbols()
            } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
              e.preventDefault()
              tr.symbol = (tr.symbol + numSymbols() - 1) % numSymbols()
            }
          }}
        /><input
          value={tr.direction === -1 ? "L" : "R"}
          class="w-5 border border-blue-200 bg-transparent py-1 text-center outline-none dark:border-blue-800"
          maxlength="1"
          autocomplete="off"
          spellcheck="false"
          oninput={(e) => {
            tr.direction = e.currentTarget.value === "L" ? -1 : 1
          }}
          onkeydown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowRight") {
              e.preventDefault()
              tr.direction = -tr.direction as 1 | -1
              e.currentTarget.value = tr.direction === -1 ? "L" : "R"
            }
          }}
        /><input
          value={stateToString(tr.toState)}
          class="w-5 border border-blue-200 bg-transparent py-1 text-center outline-none dark:border-blue-800"
          style="color: {getTmStateColorCss(tr.toState, $mode)};"
          maxlength="1"
          autocomplete="off"
          spellcheck="false"
          oninput={(e) => {
            const s = e.currentTarget.value.charCodeAt(0)
            tr.toState = s === 45 ? -1 : s - 65
          }}
          onkeydown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault()
              if (tr.toState === 25) tr.toState = 0
              else if (tr.toState === rule.length - 1) tr.toState = 25
              else ++tr.toState
            } else if (e.key === "ArrowDown") {
              e.preventDefault()
              if (tr.toState === 25) tr.toState = rule.length - 1
              else if (tr.toState === 0) tr.toState = 25
              else --tr.toState
            }
          }}
          onwheel={(e) => {
            e.preventDefault()
          }}
        />
        &nbsp;
      {/each}
    </div>
  {/each}
</div>
