<script lang="ts">
  import { pushState } from "$app/navigation"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { onMount } from "svelte"
  import Editor from "../Editor.svelte"
  import { defaultTM, formatTMRule, parseTMRule, type TMRule } from "../turing"
  import Thumbnail from "./Thumbnail.svelte"

  const initCode = $page.url.searchParams.get("r") ?? ""
  const initWidth = Number($page.url.searchParams.get("w")).valueOf() || 512
  const initNumSteps = Number($page.url.searchParams.get("steps")).valueOf() || 65536
  let code = $state(initCode)
  let rule: TMRule = $state([])
  if (initCode != null) rule = parseTMRule(initCode)
  $effect(() => {
    code = formatTMRule(rule)
  })

  let width = $state(initWidth)
  let height = $state(Number($page.url.searchParams.get("h")).valueOf() || 512)
  let numSteps = $state(initNumSteps)
  let debug = $page.url.searchParams.has("debug")

  function load() {
    rule = parseTMRule(new URLSearchParams(location.search).get("r") ?? defaultTM)
  }

  function setRuleAndPushState(newCode: string) {
    rule = parseTMRule(newCode)
    pushState(`?${new URLSearchParams({ r: newCode })}`, {})
  }

  onMount(() => {
    load()

    code = formatTMRule(rule)
  })
</script>

<svelte:window onpopstate={load} />
<svelte:head
  ><title>{code.length === 0 ? "" : `${code} - `}Turing Machine Thumbnail</title>
  <meta name="description" content="Turing machine thumbnail." />
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
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button builders={[builder]} variant="outline">▼</Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LB_1LA0RA")}>2-state bouncer</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB1LA_0LA0RB")}
          >2-state binary counter</DropdownMenu.Item
        >
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB1RZ_1LB0RC_1LC1LA")}>BB(3)</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LA_0RC1LA_1LC0RB")}
          >3-state period 92 translated cycler</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0RC_1LB1RA_0RB0RA")}
          >3-state bouncer</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LB_1LA1LC_0RA1RC")}
          >3-state bouncer 2</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LB_1LC1RB_0RA0LC")}
          >3-state binary counter</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LC_1LC1RB_0RA1LA")}
          >3-state binary counter 2</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB1LA_0LA1RC_0LA0RB")}
          >3-state binary counter 3</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB1LA_0LA1RC_0LA0RC")}
          >3-state Fibonacci counter</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LC_1LA1RB_0RB1LC")}
          >3-state inverse bell</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB1RC_1LC0RA_1RA0LB")}>3-state bell</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LC_1RC0RB_1LA1LC")}
          >3-state dual bouncer</DropdownMenu.Item
        >
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB1LC_1RD1RB_0RD0RC_1LD1LA")}>BBB(4)</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0RC_1LB1LD_0RA0LD_1LA1RC")}
          >4-state p17620q158491</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LB_0LB0RD_1LA1RB_1LC1RD")}
          >4-state binary bouncer</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => setRuleAndPushState("1RB0LA_0LC0RD_1RA1LD_0RB1LC")}
          >4-state something</DropdownMenu.Item
        >
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <Button variant="outline" href="/turing?r={code}">Interactive</Button>
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
  <Thumbnail {rule} {width} {height} bind:numSteps {debug} />
</div>
