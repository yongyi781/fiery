<script lang="ts">
  import { cn } from "$lib/utils"
  import { getTmStateColor, type TMRule } from "./turing"

  interface Props {
    rule: TMRule
  }

  let { rule = $bindable() }: Props = $props()
  function numSymbols() {
    return rule.length === 0 ? 0 : rule[0].length
  }

  function getStateColor(state: number) {
    const res = getTmStateColor(state)
    return `rgb(${res[0]}, ${res[1]}, ${res[2]})`
  }
</script>

<div class="w-full text-center">
  <div class="font-mono text-sm">
    {#each rule as row, i}
      <div>
        {#each row as cell, j}
          <span style="color: {getStateColor(i)};">{String.fromCharCode(i + 65)}{j}</span>
          &mapsto;
          <input
            type="number"
            class={cn(
              "no-arrows w-5 bg-transparent py-1 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              i === 0 && j === 0 ? "" : "border border-blue-800"
            )}
            disabled={i === 0 && j === 0}
            bind:value={cell.symbol}
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
            class={cn(
              "w-5 bg-transparent py-1 text-center outline-none",
              i === 0 && j === 0 ? "" : "border border-blue-800"
            )}
            disabled={i === 0 && j === 0}
            value={cell.direction === -1 ? "L" : "R"}
            onkeydown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault()
                cell.direction = -cell.direction as 1 | -1
                e.currentTarget.value = cell.direction === -1 ? "L" : "R"
              }
            }}
          /><input
            class={cn(
              "w-5 bg-transparent py-1 text-center outline-none",
              i === 0 && j === 0 ? "" : "border border-blue-800"
            )}
            style="color: {getStateColor(cell.toState)};"
            disabled={i === 0 && j === 0}
            value={cell.toState === -1 ? "-" : String.fromCharCode(cell.toState + 65)}
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
