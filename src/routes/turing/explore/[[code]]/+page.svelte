<script lang="ts">
  import { dev } from "$app/environment"
  import { afterNavigate, goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Switch } from "$lib/components/ui/switch"
  import { localStore } from "$lib/local-store.svelte"
  import { randomChoice } from "$lib/utils"
  import { onMount } from "svelte"
  import Content from "../../Content.svelte"
  import Editor from "../../Editor.svelte"
  import Explore from "../../Explore.svelte"
  import { initialTape } from "../../initial-tape.svelte"
  import machines from "../../machines-client"
  import { formatTMRule, parseTMRule, rulesEqual, Tape, type TuringMachineInfo } from "../../turing"
  import { turingMachineCache } from "../../turing-machine-cache.svelte"

  const { data } = $props()

  const initWidth = Number($page.url.searchParams.get("w")).valueOf()
  const initHeight = Number($page.url.searchParams.get("h")).valueOf()
  const initScale = Number($page.url.searchParams.get("scale")).valueOf()
  let initCode = data.code
  let code = $state(initCode)
  let machineInfo: TuringMachineInfo = $state({ rule: parseTMRule(initCode) })
  let width = $state({ value: initWidth })
  if (initWidth === 0) width = localStore("turing-explore-width", 1024)
  let height = $state({ value: initHeight })
  if (initHeight === 0) height = localStore("turing-explore-height", 768)
  let scale = $state({ value: initScale })
  if (initScale === 0) scale = localStore("turing-explore-scale", 8)
  let position = $state({
    t: Number($page.url.searchParams.get("t")).valueOf() || 0,
    x: Number($page.url.searchParams.get("x")).valueOf() || 0
  })
  let animate = $state($page.url.searchParams.has("animate"))
  let animateSpeed = $state(Number($page.url.searchParams.get("animateSpeed")).valueOf() || 64)
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
      (machineInfo.tape?.toString() ?? "A>0") === turingMachineCache.value.initialTape.toString()
    ) {
      machineInfo.snapshots = turingMachineCache.value.snapshots
      machineInfo.snapshotFrequency = turingMachineCache.value.snapshotFrequency
    } else {
      delete machineInfo.snapshots
      delete machineInfo.snapshotFrequency
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
  onpopstate={() => {
    const code = location.pathname.split("/").pop()
    if (code === "Explore" || !code) machineInfo.rule = parseTMRule(randomChoice(machines))
    else machineInfo.rule = parseTMRule(code)
  }}
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
  <title>{code.length === 0 ? "" : `${code} - `}Turing Machine Visualizer - Explore</title>
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
    spellcheck="false"
    bind:value={code}
    oninput={(e) => {
      const parsed = parseTMRule(code)
      if (parsed.length === 0) {
        e.currentTarget.setCustomValidity("Invalid code")
      } else {
        e.currentTarget.setCustomValidity("")
        goto(`/turing/explore/${formatTMRule(parsed)}`, { keepFocus: true })
      }
    }}
  />
  <Button
    variant="outline"
    onclick={() => {
      goto(`/turing/explore/${randomChoice(machines)}`, { keepFocus: true })
    }}>Random</Button
  >
  <Button href="/turing/{code}" class="w-24">Overview</Button>
</div>
<div class="mx-auto my-1">
  <Editor bind:rule={machineInfo.rule} />
</div>
<div class="mb-1 flex flex-col flex-wrap items-center justify-center gap-x-4 sm:flex-row">
  <div class="flex items-center gap-x-1">
    <Label for="scale" class="flex items-center gap-x-1">Scale:</Label>
    <Input
      id="scale"
      type="number"
      inputmode="numeric"
      class="w-20"
      min="1"
      autocomplete="off"
      bind:value={scale.value}
    />
  </div>
  <div class="flex items-center gap-x-1">
    <Label for="width" class="flex items-center gap-x-1">Width:</Label>
    <Input
      id="width"
      type="number"
      inputmode="numeric"
      class="w-20"
      min={1}
      max={65535}
      autocomplete="off"
      bind:value={width.value}
    />
  </div>
  <div class="flex items-center gap-x-1">
    <Label for="height" class="flex items-center gap-x-1">Height:</Label>
    <Input
      id="height"
      type="number"
      inputmode="numeric"
      class="w-20"
      min={1}
      max={65535}
      autocomplete="off"
      bind:value={height.value}
    />
  </div>
  <div class="flex items-center gap-x-1">
    <Label for="t" class="flex items-center gap-x-1">t =</Label>
    <Input id="t" type="number" inputmode="numeric" class="w-40" min={0} autocomplete="off" bind:value={position.t} />
  </div>
  <div class="flex items-center gap-x-1">
    <Label for="x" class="flex items-center gap-x-1">x =</Label>
    <Input id="x" type="number" inputmode="numeric" class="w-20" min={0} autocomplete="off" bind:value={position.x} />
  </div>
  <Button variant="outline" onclick={() => (position = { t: 0, x: 0 })}>Top</Button>
  <div class="flex items-center gap-x-1">
    <Label for="animate" class="flex items-center gap-x-1">Animate</Label>
    <Switch id="animate" bind:checked={animate} />
    <Input type="number" inputmode="numeric" class="w-24" autocomplete="off" bind:value={animateSpeed} />
  </div>
</div>
<div class="mx-auto">
  <Explore
    {machineInfo}
    bind:scale={scale.value}
    width={width.value}
    height={height.value}
    bind:position
    bind:animate
    bind:animateSpeed
    {debug}
  />
  <Input
    placeholder="Initial tape, e.g. B 110101>111"
    class="font-mono text-xs invalid:focus:ring-red-500"
    bind:value={initialTape.value}
    oninput={(e) => {
      const t = Tape.parse(e.currentTarget.value)
      if (t == null) e.currentTarget.setCustomValidity("Invalid tape")
      else e.currentTarget.setCustomValidity("")
    }}
  />
</div>
<div class="mx-auto mt-2">
  <a class="text-cyan-500 hover:underline" href="https://bbchallenge.org/{code}">See machine on bbchallenge</a>
  &bullet;
  <Dialog.Root>
    <Dialog.Trigger class="text-cyan-500 hover:underline">Mouse and keyboard shortcuts</Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title class="mb-4">Mouse and keyboard shortcuts</Dialog.Title>
        <Dialog.Description class="grid grid-cols-[auto_auto] gap-4">
          <hr class="col-span-2" />
          <span class="mr-2 text-gray-600 dark:text-gray-400">Home</span>
          <span class="text-gray-900 dark:text-gray-100">Reset position to (0, 0)</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">0</span>
          <span class="text-gray-900 dark:text-gray-100">Jump to top</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Shift + 0 / Insert</span>
          <span class="text-gray-900 dark:text-gray-100">Jump to x-coordinate 0</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">1&ndash;9</span>
          <span class="text-gray-900 dark:text-gray-100">n ↦ Seek to 10<sup>n</sup> steps</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Ctrl + 0&ndash;9</span>
          <span class="text-gray-900 dark:text-gray-100">Set zoom level</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Alt + 0&ndash;9</span>
          <span class="text-gray-900 dark:text-gray-100">Set animate speed</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Space</span>
          <span class="text-gray-900 dark:text-gray-100">Toggle animate</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">+ / -</span>
          <span class="text-gray-900 dark:text-gray-100">Increase/decrease animate speed</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">[ / ]</span>
          <span class="text-gray-900 dark:text-gray-100">Increase/decrease zoom scale</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">J / K / L</span>
          <span class="text-gray-900 dark:text-gray-100">Jump to left edge/head/right edge of tape</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Ctrl + C</span>
          <span class="text-gray-900 dark:text-gray-100">(In analyze mode) Copy tape at mouse</span>
          <hr class="col-span-2" />
          <span class="mr-2 text-gray-600 dark:text-gray-400">Click</span>
          <span class="text-gray-900 dark:text-gray-100">Toggle analyze mode</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Mouse wheel</span>
          <span class="text-gray-900 dark:text-gray-100">Move vertically</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Shift + Mouse wheel</span>
          <span class="text-gray-900 dark:text-gray-100">Move horizontally</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Ctrl + Mouse wheel</span>
          <span class="text-gray-900 dark:text-gray-100">Zoom</span>
          <span class="mr-2 text-gray-600 dark:text-gray-400">Alt + Mouse wheel</span>
          <span class="text-gray-900 dark:text-gray-100">Adjust animate speed by powers of 2</span>
          <hr class="col-span-2" />
        </Dialog.Description>
      </Dialog.Header>
    </Dialog.Content>
  </Dialog.Root>
</div>
<Content rule={machineInfo.rule} />
