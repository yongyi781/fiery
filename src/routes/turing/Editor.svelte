<script lang="ts">
  import { cn } from "$lib/utils"
  import { getTmStateColor, getTmStateColorCss, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
  }

  let { rule = $bindable() }: Props = $props()
  function numSymbols() {
    return rule.length === 0 ? 0 : rule[0].length
  }
</script>

<div class="w-full text-center">
  <div class="font-mono text-sm">
    {#each rule as row, i}
      <div>
        {#each row as cell, j}
          <span style="color: {getTmStateColorCss(i)};">{String.fromCharCode(i + 65)}{j}</span>
          &mapsto;
          <input
            type="number"
            bind:value={cell.symbol}
            class="no-arrows w-5 border border-blue-200 bg-transparent py-1 text-center outline-none [appearance:textfield] dark:border-blue-800 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            maxlength="1"
            autocomplete="off"
            onkeydown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowRight") {
                e.preventDefault()
                cell.symbol = (cell.symbol + 1) % numSymbols()
              } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
                e.preventDefault()
                cell.symbol = (cell.symbol + numSymbols() - 1) % numSymbols()
              }
            }}
          /><input
            value={cell.direction === -1 ? "L" : "R"}
            class="w-5 border border-blue-200 bg-transparent py-1 text-center outline-none dark:border-blue-800"
            maxlength="1"
            onkeydown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault()
                cell.direction = -cell.direction as 1 | -1
                e.currentTarget.value = cell.direction === -1 ? "L" : "R"
              }
            }}
          /><input
            value={cell.toState === -1 ? "-" : String.fromCharCode(cell.toState + 65)}
            class="w-5 border border-blue-200 bg-transparent py-1 text-center outline-none dark:border-blue-800"
            style="color: {getTmStateColorCss(cell.toState)};"
            disabled={i === 0 && j === 0}
            maxlength="1"
            autocomplete="off"
            oninput={(e) => {
              const s = e.currentTarget.value.charCodeAt(0)
              cell.toState = s === 45 ? -1 : s - 65
            }}
            onkeydown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault()
                if (cell.toState === 25) cell.toState = 0
                else if (cell.toState === rule.length - 1) cell.toState = 25
                else ++cell.toState
              } else if (e.key === "ArrowDown") {
                e.preventDefault()
                if (cell.toState === 25) cell.toState = rule.length - 1
                else if (cell.toState === 0) cell.toState = 25
                else --cell.toState
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
</div>
