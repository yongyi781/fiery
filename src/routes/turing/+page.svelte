<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Switch } from "$lib/components/ui/switch"
  import { onMount } from "svelte"
  import Editor from "./Editor.svelte"
  import TMCanvas from "./TMCanvas.svelte"
  import { defaultTM, formatTMRule, parseTMRule, type TMRule } from "./turing"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"

  let cellSize = $state(8)
  let height = $state(900)
  let rule: TMRule = $state(parseTMRule(defaultTM))
  let code = $state(defaultTM)
  let startStep = $state(0)
  let animate = $state(false)
  let animateSpeed = $state(1)

  onMount(() => {
    rule = parseTMRule(new URLSearchParams(location.search).get("rule") ?? defaultTM)

    function draw() {
      startStep = Math.max(0, startStep + animateSpeed)
      if (animate) requestAnimationFrame(draw)
    }

    $effect(() => {
      if (animate) requestAnimationFrame(draw)
    })
  })
</script>

<svelte:head><title>Turing Machine Visualizer</title></svelte:head>

<div class="flex items-center gap-x-2">
  <Label for="code">Code:</Label>
  <Input id="code" class="font-mono text-sm" bind:value={code} onchange={() => (rule = parseTMRule(code))} />
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button builders={[builder]} variant="outline">▼</Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LB_1LA0RA"))}>2-state bouncer</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB1LA_0LA0RB"))}
          >2-state binary counter</DropdownMenu.Item
        >
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB1RZ_1LB0RC_1LC1LA"))}>BB(3)</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LA_0RC1LA_1LC0RB"))}
          >3-state period 92 translated cycler</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0RC_1LB1RA_0RB0RA"))}
          >3-state bouncer</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LB_1LA1LC_0RA1RC"))}
          >3-state bouncer 2</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LB_1LC1RB_0RA0LC"))}
          >3-state binary counter</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LC_1LC1RB_0RA1LA"))}
          >3-state binary counter 2</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB1LA_0LA1RC_0LA0RB"))}
          >3-state binary counter 3</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB1LA_0LA1RC_0LA0RC"))}
          >3-state Fibonacci counter</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LC_1LA1RB_0RB1LC"))}
          >3-state inverse bell</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB1RC_1LC0RA_1RA0LB"))}>3-state bell</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LC_1RC0RB_1LA1LC"))}
          >3-state dual bouncer</DropdownMenu.Item
        >
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB1LC_1RD1RB_0RD0RC_1LD1LA"))}>BBB(4)</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0RC_1LB1LD_0RA0LD_1LA1RC"))}
          >4-state p17620q158491</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LB_0LB0RD_1LA1RB_1LC1RD"))}
          >4-state binary bouncer</DropdownMenu.Item
        >
        <DropdownMenu.Item onclick={() => (rule = parseTMRule("1RB0LA_0LC0RD_1RA1LD_0RB1LC"))}
          >4-state something</DropdownMenu.Item
        >
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
<Editor bind:rule />
<div class="mt-4 flex items-center justify-center gap-x-1 whitespace-nowrap">
  <Label for="cellSize">Cell size:</Label>
  <Input id="cellSize" class="basis-20" type="number" min="1" max="32" bind:value={cellSize} />
  <Label for="numSteps" class="ml-4">Height:</Label>
  <Input id="numSteps" class="basis-20" type="number" min={1} max={65535} bind:value={height} />
  <Label for="startStep" class="ml-4">Start step:</Label>
  <Input id="startStep" class="basis-40" type="number" min={0} max={2147483647} bind:value={startStep} />
  <Button variant="outline" onclick={() => (startStep = 0)}>Top</Button>
  <Switch id="animate" class="ml-4" bind:checked={animate} /><Label for="animate">Animate</Label><Input
    type="number"
    class="basis-24"
    bind:value={animateSpeed}
  />
</div>
<div class="mt-3 self-center">
  <TMCanvas {rule} bind:cellSize {height} bind:startStep bind:animate bind:animateSpeed />
</div>
