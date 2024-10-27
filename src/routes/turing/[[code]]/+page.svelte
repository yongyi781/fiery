<script lang="ts">
  import { dev } from "$app/environment"
  import { afterNavigate, goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { turingMachineCache } from "$lib/turing-machine-cache.svelte"
  import { randomChoice } from "$lib/utils"
  import { onMount } from "svelte"
  import Content from "../Content.svelte"
  import Editor from "../Editor.svelte"
  import machines from "../machines"
  import Overview from "../Overview.svelte"
  import { formatTMRule, parseTMRule, rulesEqual, Tape, TuringMachine } from "../turing"

  let { data } = $props()

  const initWidth = Number($page.url.searchParams.get("w")).valueOf() || 512
  const initNumSteps = Number($page.url.searchParams.get("n")).valueOf() || 65536
  let initCode = data.code ?? ""
  let code = $state(initCode)
  let rule = $state(parseTMRule(initCode))
  let machine = $state(new TuringMachine())
  let width = $state(initWidth)
  let height = $state(Number($page.url.searchParams.get("h")).valueOf() || 512)
  let numSteps = $state(initNumSteps)
  let quality = $state(Number($page.url.searchParams.get("q")).valueOf() || 1)
  let debug = $page.url.searchParams.has("debug") || dev

  $effect(() => {
    if (rule.length > 0) code = formatTMRule(rule)
  })

  $effect(() => {
    if (!rulesEqual(rule, machine.rule)) {
      // Rule changed reactively, update machine to a new machine with that rule.
      console.log(formatTMRule(rule), formatTMRule(machine.rule))
      machine = new TuringMachine($state.snapshot(rule))
      if (turingMachineCache.value != null && rulesEqual(machine.rule, turingMachineCache.value.rule)) {
        machine.snapshots = turingMachineCache.value.snapshots.map((tape) => new Tape(tape))
        machine.snapshotFrequency = turingMachineCache.value.snapshotFrequency
      }
    }
  })

  afterNavigate(() => {
    const code = location.pathname.split("/").pop()
    if (code === "turing" || !code) {
    } else rule = parseTMRule(code)
  })

  onMount(() => {
    document.querySelector("canvas")?.focus()
  })
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "F" && e.altKey) {
      e.preventDefault()
      const codeInput = document.querySelector("#code") as HTMLInputElement
      codeInput.setSelectionRange(0, codeInput.value.length)
      codeInput.focus()
    }
  }}
/><svelte:head
  ><title>{code.length === 0 ? "" : `${code} - `}Turing Machine Visualizer - Overview</title>
  <meta
    name="description"
    content="High performance Turing machine visualizer, useful for the Busy Beaver challenge."
  />
</svelte:head>

<div class="flex flex-wrap items-center justify-center gap-1">
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
    bind:value={code}
    oninput={(e) => {
      const parsed = parseTMRule(code)
      if (parsed.length === 0) {
        e.currentTarget.setCustomValidity("Invalid code")
      } else {
        e.currentTarget.setCustomValidity("")
        goto(`/turing/${formatTMRule(parsed)}`, { keepFocus: true })
      }
    }}
  />
  <Button
    variant="outline"
    onclick={() => {
      goto(`/turing/${randomChoice(machines)}`, { keepFocus: true })
    }}>Random</Button
  >
  <Button variant="outline" href="/turing/explore/{code}" class="ml-4">Explore</Button>
</div>
<Editor bind:rule />
<div class="mt-4 flex flex-wrap items-center justify-center gap-1 whitespace-nowrap">
  <Label for="width" class="ml-4">Width:</Label>
  <Input type="number" id="width" min={1} max={65535} class="w-20" autocomplete="off" bind:value={width} />
  <Label for="height" class="ml-4">Height:</Label>
  <Input type="number" id="height" min={1} max={65535} class="w-20" autocomplete="off" bind:value={height} />
  <Label for="numSteps" class="ml-4"># steps:</Label>
  <Input type="number" id="numSteps" min={0} class="w-40" autocomplete="off" bind:value={numSteps} />
  <Label for="quality" class="ml-4">Quality:</Label>
  <Input type="number" id="quality" min={1} class="w-20" autocomplete="off" bind:value={quality} />
</div>
<div class="mt-3 self-center">
  <Overview {machine} {width} {height} bind:numSteps {quality} interactive {debug} />
</div>
<div class="self-center">
  <a class="text-cyan-500 hover:underline" href="https://bbchallenge.org/{code}">See machine on bbchallenge</a> &bullet;
  <Dialog.Root>
    <Dialog.Trigger class="text-cyan-500 hover:underline">Mouse and keyboard shortcuts</Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title class="mb-4">Mouse and keyboard shortcuts</Dialog.Title>
        <Dialog.Description class="grid grid-cols-[auto_auto] gap-4">
          <hr class="col-span-2" />
          <span class="mr-2 text-gray-600 dark:text-gray-400">0 / Home</span>
          <span class="text-gray-900 dark:text-gray-100">See 65536 steps</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">1&ndash;9</span>
          <span class="text-gray-900 dark:text-gray-100">n &mapsto; See 65536 × 2<sup>n</sup> steps</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">+ / -</span>
          <span class="text-gray-900 dark:text-gray-100">Increase/decrease number of steps</span>
          <hr class="col-span-2" />
          <span class="mr-2 text-gray-600 dark:text-gray-400">Click</span>
          <span class="text-gray-900 dark:text-gray-100">Toggle analyze mode</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Double click</span>
          <span class="text-gray-900 dark:text-gray-100">Explore clicked location</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Ctrl + Mouse wheel</span>
          <span class="text-gray-900 dark:text-gray-100">Increase/decrease number of steps</span>
          <hr class="col-span-2" />
        </Dialog.Description>
      </Dialog.Header>
    </Dialog.Content>
  </Dialog.Root>
</div>
<Content />
