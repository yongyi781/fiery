<script lang="ts">
  import { dev } from "$app/environment"
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
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

  onMount(() => {
    $effect(() => {
      if (!rulesEqual(rule, machine.rule)) {
        const m = new TuringMachine($state.snapshot(rule))
        if (turingMachineCache.value != null && rulesEqual(m.rule, turingMachineCache.value.rule)) {
          m.snapshots = turingMachineCache.value.snapshots.map((tape) => new Tape(tape))
          m.snapshotFrequency = turingMachineCache.value.snapshotFrequency
        }
        machine = m
        goto(`/turing/${code}`, { keepFocus: true, replaceState: true })
      }
    })

    document.querySelector("canvas")?.focus()
  })
</script>

<svelte:window
  onpopstate={() => {
    const code = location.pathname.split("/").pop()
    if (code === "turing" || !code) {
      rule = parseTMRule(randomChoice(machines))
    } else rule = parseTMRule(code)
  }}
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
        if (!rulesEqual(rule, parsed)) goto(`/turing/${code}`, { keepFocus: true })
        rule = parsed
      }
    }}
  />
  <Button
    variant="outline"
    onclick={() => {
      const code = randomChoice(machines)
      rule = parseTMRule(code)
      goto(`/turing/${code}`, { keepFocus: true })
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
  <a class="text-cyan-500 hover:underline" href="/turing/{code}">Permalink</a>
</div>
<Content />
