<script lang="ts">
  import { pushState } from "$app/navigation"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Switch } from "$lib/components/ui/switch"
  import { onMount } from "svelte"
  import { randomChoice } from "../../../../utils"
  import Editor from "../../Editor.svelte"
  import Interactive from "../../Interactive.svelte"
  import machines from "../../machines"
  import { formatTMRule, parseTMRule, type TMRule } from "../../turing"

  const initCode = $page.params.code ?? randomChoice(machines)
  const initStartStep = Number($page.url.searchParams.get("t")).valueOf() || 0
  let code = $state(initCode)
  let rule: TMRule = $state(parseTMRule(initCode))
  let scale = $state(Number($page.url.searchParams.get("scale")).valueOf() || 2)
  let width = $state(Number($page.url.searchParams.get("w")).valueOf() || 1024)
  let height = $state(Number($page.url.searchParams.get("h")).valueOf() || 768)
  let startStep = $state(initStartStep)
  let animate = $state($page.url.searchParams.has("animate"))
  let animateSpeed = $state(Number($page.url.searchParams.get("animateSpeed")).valueOf() || 1)
  let debug = $page.url.searchParams.has("debug")

  function load() {
    const code = location.pathname.split("/").pop()
    if (code === "interactive" || !code) rule = parseTMRule(randomChoice(machines))
    else rule = parseTMRule(code)
  }

  function setRuleAndPushState(newCode: string) {
    rule = parseTMRule(newCode)
    startStep = initStartStep
    pushState(`/turing/interactive/${newCode}`, {})
  }

  function draw() {
    startStep = Math.max(0, startStep + animateSpeed)
    if (animate) requestAnimationFrame(draw)
  }

  onMount(() => {
    $effect(() => {
      code = formatTMRule(rule)
    })

    $effect(() => {
      if (animate) requestAnimationFrame(draw)
    })

    code = formatTMRule(rule)
  })
</script>

<svelte:window onpopstate={load} />
<svelte:head
  ><title>{code.length === 0 ? "" : `${code} - `}Turing Machine Visualizer - Interactive</title>
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
  <Input id="code" class="w-96 font-mono text-sm" bind:value={code} onchange={() => setRuleAndPushState(code)} />
  <Button variant="outline" href="/turing/{code}">Overview</Button>
</div>
<Editor bind:rule />
<div class="mt-4 flex flex-wrap items-center justify-center gap-1 whitespace-nowrap">
  <Label for="scale">Scale:</Label>
  <Input id="scale" class="w-20" type="number" min="1" max="32" bind:value={scale} />
  <Label for="width" class="ml-4">Width:</Label>
  <Input id="width" class="w-20" type="number" min={1} max={65535} bind:value={width} />
  <Label for="height" class="ml-4">Height:</Label>
  <Input id="height" class="w-20" type="number" min={1} max={65535} bind:value={height} />
  <Label for="startStep" class="ml-4">Start step:</Label>
  <Input id="startStep" class="w-40" type="number" min={0} max={2147483647} bind:value={startStep} />
  <Button variant="outline" onclick={() => (startStep = 0)}>Top</Button>
  <Switch id="animate" class="ml-4" bind:checked={animate} /><Label for="animate">Animate</Label><Input
    type="number"
    class="w-24"
    bind:value={animateSpeed}
  />
</div>
<div class="mt-3 self-center">
  <Interactive {rule} bind:scale bind:width bind:height bind:startStep bind:animate bind:animateSpeed {debug} />
</div>
<div class="self-center">
  <a class="text-cyan-500 hover:underline" href="https://bbchallenge.org/{code}">See machine on bbchallenge</a>
</div>
