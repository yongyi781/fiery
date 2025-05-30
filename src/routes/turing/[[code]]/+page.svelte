<script lang="ts">
  import { dev } from "$app/environment"
  import { afterNavigate, goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { localStore } from "$lib/local-store.svelte"
  import { randomChoice } from "$lib/utils"
  import { onMount } from "svelte"
  import Content from "../Content.svelte"
  import Editor from "../Editor.svelte"
  import { initialTape } from "../initial-tape.svelte"
  import machines from "../machines-client"
  import Overview from "../Overview.svelte"
  import { formatTMRule, parseTMRule, rulesEqual, Tape, type TuringMachineInfo } from "../turing"
  import { turingMachineCache } from "../turing-machine-cache.svelte"

  let { data } = $props()

  const initWidth = Number($page.url.searchParams.get("w")).valueOf()
  const initHeight = Number($page.url.searchParams.get("h")).valueOf()
  let initCode = data.code ?? ""
  let code = $state(initCode)
  let machineInfo: TuringMachineInfo = $state({ rule: parseTMRule(initCode) })
  let width = $state({ value: initWidth })
  if (initWidth === 0) width = localStore("turing-overview-width", 512)
  let height = $state({ value: initHeight })
  if (initHeight === 0) height = localStore("turing-overview-height", 512)
  let numSteps = $state(Number($page.url.searchParams.get("n")).valueOf() || 65536)
  let quality = $state(Number($page.url.searchParams.get("q")).valueOf() || 1)
  const debug = $page.url.searchParams.has("debug") || dev

  $effect(() => {
    if (machineInfo.rule.length > 0) code = formatTMRule(machineInfo.rule)
  })

  $effect(() => {
    const t = Tape.parse(initialTape.value)
    if (t != null) machineInfo.tape = t
  })

  $effect(() => {
    if (
      turingMachineCache.value != null &&
      rulesEqual(machineInfo.rule, turingMachineCache.value.rule) &&
      machineInfo.tape === turingMachineCache.value.initialTape
    ) {
      machineInfo.snapshots = turingMachineCache.value.snapshots
      machineInfo.snapshotFrequency = turingMachineCache.value.snapshotFrequency
    }
  })

  afterNavigate(() => {
    const code = location.pathname.split("/").pop()
    if (code != null && code != "turing") machineInfo.rule = parseTMRule(code)
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
/>
<svelte:head>
  <title>{code.length === 0 ? "" : `${code} - `}Turing Machine Visualizer - Overview</title>
  <meta
    name="description"
    content="High performance Turing machine visualizer, useful for the Busy Beaver challenge."
  />
</svelte:head>

<div class="flex flex-col flex-wrap items-center justify-center gap-x-1 md:flex-row">
  <Label for="code" class="text-nowrap">
    Code in
    <a
      class="text-cyan-500 hover:underline"
      href="https://discuss.bbchallenge.org/t/standard-tm-text-format/60"
      target="_blank">standard format</a
    >:
  </Label>
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
  <Button class="w-24" href="/turing/explore/{code}">Explore</Button>
</div>
<div class="mx-auto my-1">
  <Editor bind:rule={machineInfo.rule} />
</div>
<div class="mb-1 flex flex-col flex-wrap items-center justify-center gap-x-1 whitespace-nowrap text-xs md:flex-row">
  <div class="flex items-center gap-x-1">
    <Label for="width" class="ml-4 flex items-center gap-x-1">Width:</Label>
    <Input id="width" type="number" min={1} max={65535} class="w-20" autocomplete="off" bind:value={width.value} />
  </div>
  <div class="flex items-center gap-x-1">
    <Label for="height" class="ml-4 flex items-center gap-x-1">Height:</Label>
    <Input id="height" type="number" min={1} max={65535} class="w-20" autocomplete="off" bind:value={height.value} />
  </div>
  <div class="flex items-center gap-x-1">
    <Label for="numSteps" class="ml-4 flex items-center gap-x-1"># steps:</Label>
    <Input id="numSteps" type="number" min={0} class="w-40" autocomplete="off" bind:value={numSteps} />
  </div>
  <div class="flex items-center gap-x-1">
    <Label for="quality" class="ml-4 flex items-center gap-x-1">Quality:</Label>
    <Input id="quality" type="number" min={1} class="w-20" autocomplete="off" bind:value={quality} />
  </div>
</div>
<div class="mx-auto">
  <Overview {machineInfo} width={width.value} height={height.value} bind:numSteps {quality} interactive {debug} />
  <Input
    placeholder="Initial tape, e.g. B 110101>111"
    class="font-mono text-xs invalid:focus:ring-red-500"
    bind:value={initialTape.value}
    oninput={(e) => {
      if (Tape.parse(e.currentTarget.value) == null) e.currentTarget.setCustomValidity("Invalid tape")
      else e.currentTarget.setCustomValidity("")
    }}
  />
</div>
<div class="mx-auto mt-2">
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
          <span class="text-gray-900 dark:text-gray-100">n ↦ See 65536 × 2<sup>n</sup> steps</span>
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
<Content rule={machineInfo.rule} />
