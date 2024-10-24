<script lang="ts">
  import { pushState } from "$app/navigation"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { onMount } from "svelte"
  import { randomChoice } from "../../../utils"
  import Editor from "../Editor.svelte"
  import machines from "../machines"
  import Overview from "../Overview.svelte"
  import { formatTMRule, parseTMRule, type TMRule } from "../turing"

  let { data } = $props()

  const initWidth = Number($page.url.searchParams.get("w")).valueOf() || 512
  const initNumSteps = Number($page.url.searchParams.get("n")).valueOf() || 65536
  let initCode = data.code
  let code = $state(initCode)
  let rule: TMRule = $state(parseTMRule(initCode))
  let width = $state(initWidth)
  let height = $state(Number($page.url.searchParams.get("h")).valueOf() || 512)
  let numSteps = $state(initNumSteps)
  let debug = $page.url.searchParams.has("debug")

  onMount(() => {
    $effect(() => {
      if (rule.length > 0) code = formatTMRule(rule)
    })
  })
</script>

<svelte:window
  onpopstate={() => {
    const code = location.pathname.split("/").pop()
    if (code === "turing" || !code) rule = parseTMRule(randomChoice(machines))
    else rule = parseTMRule(code)
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
    bind:value={code}
    oninput={(e) => {
      const parsed = parseTMRule(code)
      if (parsed.length === 0) {
        e.currentTarget.setCustomValidity("Invalid code")
        e.currentTarget.reportValidity()
      } else {
        rule = parsed
        e.currentTarget.setCustomValidity("")
        pushState(`/turing/${code}`, {})
      }
    }}
  />
  <Button
    variant="outline"
    onclick={() => {
      const code = randomChoice(machines)
      rule = parseTMRule(code)
      pushState(`/turing/${code}`, {})
    }}>Random</Button
  >
  <Button variant="outline" href="/turing/explore/{code}" class="ml-4">Explore</Button>
</div>
<Editor bind:rule />
<div class="mt-4 flex flex-wrap items-center justify-center gap-1 whitespace-nowrap">
  <Label for="width" class="ml-4">Width:</Label>
  <Input id="width" class="w-20" type="number" min={1} max={65535} bind:value={width} />
  <Label for="height" class="ml-4">Height:</Label>
  <Input id="height" class="w-20" type="number" min={1} max={65535} bind:value={height} />
  <Label for="numSteps" class="ml-4"># steps:</Label>
  <Input id="numSteps" class="w-40" type="number" min={0} bind:value={numSteps} />
</div>
<div class="mt-3 self-center">
  <Overview {rule} {width} {height} bind:numSteps {debug} />
</div>
<div class="self-center">
  <a class="text-cyan-500 hover:underline" href="https://bbchallenge.org/{code}">See machine on bbchallenge</a> &bullet;
  <a class="text-cyan-500 hover:underline" href="/turing/{code}">Permalink</a>
</div>
