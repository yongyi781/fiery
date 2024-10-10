<script lang="ts">
  import { replaceState } from "$app/navigation"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import * as Resizable from "$lib/components/ui/resizable"
  import * as Table from "$lib/components/ui/table"
  import { cn } from "$lib/utils"
  import { onMount } from "svelte"
  import CopyButton from "./CopyButton.svelte"
  import SquareTable from "./SquareTable.svelte"
  import TriTable from "./TriTable.svelte"
  import OeisText from "./OeisText.svelte"

  interface OeisResponse {
    number: number
    data: string
    name: string
    comment?: string[]
    link?: string[]
    formula?: string[]
    example?: string[]
    maple?: string[]
    mathematica?: string[]
    program?: string[]
    xref: string[]
    keyword: string
    offset: string
    author?: string
    ext?: string[]
    references: number
    revision: number
    time: string
    created: string
  }

  interface Program {
    language: string
    code: string
  }

  interface OeisEntry {
    number: number
    acode: string
    data: bigint[]
    name: string
    comment?: string[]
    links?: string[]
    formula?: string[]
    example?: string[]
    maple?: string[]
    mathematica?: string[]
    programs?: Program[]
    xref: string[]
    keywords: string[]
    offset: {
      firstTermIndex: number
      firstNontrivialTermIndex: number
    }
    author?: string
    ext?: string[]
    references: number
    revision: number
    time: Date
    created: Date
  }

  const keywordEmojis: Record<string, string> = {
    core: "❗",
    dead: "☠️",
    dumb: "🤷🏻",
    dupe: "🔁",
    easy: "🪶",
    fini: "🛑",
    frac: "➗",
    hard: "🧱",
    less: "⬇️",
    look: "📈",
    more: "🙏🏻",
    mult: "∏",
    new: "🆕",
    nice: "🌹",
    sign: "±",
    tabf: "⛩",
    tabl: "🔢"
  }

  const termsPerRow = 8

  const defaultQuery = "1,1,2,5,14,42"
  let query: string = $state(defaultQuery)
  let tried = $state(false)
  let serverResponse: Response | undefined = $state()
  let oeisResponses: OeisResponse[] = $state([])
  let oeisEntries: OeisEntry[] = $derived(
    oeisResponses?.map((r) => {
      let programs: Program[] = []
      if (r.program != null)
        for (const p of r.program) {
          if (p.startsWith("(") && p[1] == p[1].toUpperCase()) {
            let i = p.indexOf(")")
            programs.push({
              language: p.slice(1, i),
              code: p.slice(i + 1).trim()
            })
          } else if (programs.length == 0) {
            programs.push({
              language: "?",
              code: p
            })
          } else {
            programs[programs.length - 1].code += (programs[programs.length - 1].code == "" ? "" : "\n") + p
          }
        }
      let offsets = r.offset.split(",").map((s) => Number(s.trim()))
      return {
        ...r,
        acode: "A" + r.number.toString().padStart(6, "0"),
        data: r.data.split(",").map((s) => BigInt(s.trim())),
        links: r.link?.map((s) =>
          s.replaceAll(/href="\//g, 'href="https://oeis.org/').replaceAll("<a ", '<a target="_blank" ')
        ),
        programs,
        keywords: r.keyword.split(","),
        offset: {
          firstTermIndex: offsets[0],
          firstNontrivialTermIndex: offsets[1]
        },
        time: new Date(r.time),
        created: new Date(r.created)
      }
    })
  )
  let selected: OeisEntry | undefined = $state()
  let fetching = $state(false)
  let hasMore = $state(true)
  let isCons = $derived(selected != null && selected.keywords.includes("cons"))
  let isTabl = $derived(selected != null && selected.keywords.includes("tabl"))

  function prepHtml(s: string) {
    return s.replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  }

  function processAuthors(s: string) {
    return s.replaceAll(/(?: |^)_(.+?)_/g, ' <a href="https://oeis.org/wiki/User:$1" target="_blank">$1</a>')
  }

  function processANumbers(s: string) {
    return s.replaceAll(/A((?:\d+){6})/g, '<a href="?q=id:A$1" target="_blank" class="anumber">A$1</a>')
  }

  function syntaxHighlight(s: string) {
    return s
      .replaceAll(/(?<!\w\w)-(?!\w\w|&gt;|\s+_)/g, '<span class="text-red-500">-</span>') // must be first
      .replaceAll("+", '<span class="text-green-500">+</span>')
      .replaceAll("*", '<span class="text-blue-500">*</span>')
      .replaceAll(/(?<![:</])\//g, '<span class="text-yellow-700">/</span>')
      .replaceAll("^", '<span class="text-purple-500">^</span>')
      .replaceAll(/([()])/g, '<span class="text-yellow-700 dark:text-yellow-500">$1</span>')
      .replaceAll(/([{}])/g, '<span class="text-cyan-700 dark:text-cyan-500">$1</span>')
  }

  function fromCons(data: bigint[], offset: number) {
    let s = data.slice(0, offset).join("")
    if (offset >= data.length) return s
    return s + "." + data.slice(offset).join("")
  }

  async function getOeis() {
    if (!fetching && query.trim() != "") {
      tried = true
      fetching = true
      let url = `/oeis/api/search?q=${query}&start=${oeisResponses.length}`
      serverResponse = await fetch(url)
      if (serverResponse.ok) {
        try {
          let res: OeisResponse[] = await serverResponse.json()
          if (!res?.length || oeisResponses.findIndex((r) => r.number === res[0].number) != -1) hasMore = false
          else oeisResponses.push(...res)

          if (res != null && res.length % 10 !== 0) hasMore = false
        } catch (e) {
          console.error(e)
        }
      }
      fetching = false
    }
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    replaceState(`?${new URLSearchParams({ q: query })}`, { query })

    selected = undefined
    oeisResponses.length = 0
    hasMore = true
    await getOeis()
    selected = oeisEntries?.length > 0 ? oeisEntries[0] : undefined
  }

  onMount(async () => {
    const searchParams = new URLSearchParams(window.location.search)
    query = searchParams.get("q") ?? defaultQuery
    await getOeis()
    selected = oeisEntries?.length > 0 ? oeisEntries[0] : undefined
  })
</script>

<svelte:head><title>OEIS</title></svelte:head>

<form onsubmit={onSubmit} class="flex items-center gap-x-3">
  <Input placeholder="Search, e.g. 1,1,2,3,5,8" bind:value={query} />
  <Button type="submit" disabled={fetching}>Search</Button>
</form>

{#if oeisEntries.length == 0}
  <div class="mt-10 text-center">
    {fetching ? "Grabbing data from OEIS..." : tried ? "No results." : ""}
  </div>
{:else}
  <Resizable.PaneGroup direction="horizontal" class="mt-1">
    <Resizable.Pane class="relative" defaultSize={33}>
      <div class="absolute h-full w-full overflow-auto">
        <Table.Root
          tabindex={0}
          onkeydown={(e) => {
            if (e.key === "ArrowUp") {
              let i = oeisEntries.findIndex((r) => r.number === selected?.number)
              if (i > 0) selected = oeisEntries[i - 1]
            } else if (e.key === "ArrowDown") {
              let i = oeisEntries.findIndex((r) => r.number === selected?.number)
              if (i < oeisEntries.length - 1) selected = oeisEntries[i + 1]
            }
          }}
        >
          <Table.Body>
            {#each oeisEntries as r, i}
              <Table.Row
                class={cn("select-none", selected?.number === r.number ? "bg-muted hover:bg-muted" : "")}
                onmousedown={() => (selected = r)}
              >
                <Table.Cell class="text-center font-mono">{i + 1}</Table.Cell>
                <Table.Cell class="text-center font-mono"
                  >{r.acode}
                  <div>
                    {#each r.keywords.map((x) => [x, keywordEmojis[x]]) as [x, e]}
                      <span title={x}>{e}</span>
                    {/each}
                  </div>
                </Table.Cell>
                <Table.Cell>{r.name}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
        {#if hasMore && oeisEntries.length > 0}
          <Button variant="ghost" class="w-full" onclick={getOeis} disabled={fetching}>Load more</Button>
        {/if}
      </div>
    </Resizable.Pane>
    {#if selected != null}
      <Resizable.Handle withHandle />
      <Resizable.Pane class="relative">
        <!-- Data -->
        <div class="oeis absolute h-full w-full overflow-y-auto p-4">
          <h2 class="mt-3 text-center text-xl font-bold">
            <a
              href="https://oeis.org/{selected.acode}"
              target="_blank"
              class="oeis"
              title="Open the OEIS page for this sequence">{selected.acode}</a
            >
            (<a
              href="https://oeis.org/{selected.acode}/b{selected.number.toString().padStart(6, '0')}.txt"
              target="_blank"
              class="oeis"
              title="Open the full text file for this sequence">full text file</a
            >)
          </h2>
          <OeisText text={selected.name} />
          <div>
            <div class="mb-2 mt-3 flex items-center gap-2">
              <h3 class="text-xl font-bold">
                {isCons ? "Decimal expansion" : isTabl ? "Table" : "Terms"} (first {selected.data.length} terms)
              </h3>
              <CopyButton
                text={isCons ? fromCons(selected.data, selected.offset.firstTermIndex) : selected.data.join(", ")}
              />
            </div>
            {#if isCons}
              <div class="ml-10 break-words font-mono text-sm">
                {fromCons(selected.data, selected.offset.firstTermIndex)}
              </div>
            {:else if isTabl}
              <div class="ml-10 flex flex-wrap gap-x-10">
                <TriTable data={selected.data} offset={selected.offset.firstTermIndex} />
                <SquareTable data={selected.data} offset={selected.offset.firstTermIndex} />
              </div>
            {:else}
              <ul class="ml-10 font-mono text-sm">
                {#each Array(Math.ceil(selected.data.length / termsPerRow)) as _, i}
                  <li>
                    <span class="select-none text-gray-400">
                      a<sub>{termsPerRow * i + selected.offset.firstTermIndex}</sub> =&nbsp;
                    </span>{selected.data.slice(termsPerRow * i, termsPerRow * i + termsPerRow).join(", ")}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
          {#if selected.example != null && selected.example.length > 0}
            <div>
              <h3 class="mt-3 text-xl font-bold">Example</h3>
              <pre class="ml-10 whitespace-pre-wrap break-words text-sm">{selected.example.join("\n")}</pre>
            </div>
          {/if}
          {#if selected.formula != null && selected.formula.length > 0}
            <div>
              <h3 class="mt-3 text-xl font-bold">Formulas ({selected.formula.length})</h3>
              <ol
                class="ml-10 list-decimal space-y-2 whitespace-pre-wrap -indent-4 font-mono text-sm marker:text-gray-400"
              >
                {#each selected.formula as formula}
                  <li class="pl-4"><OeisText text={formula} /></li>
                {/each}
              </ol>
            </div>
          {/if}
          {#if selected.programs != null && selected.programs.length > 0}
            <div>
              <h3 class="mt-3 text-xl font-bold">Programs ({selected.programs.length})</h3>
              <ol class="ml-10 list-decimal space-y-2 font-mono text-sm marker:text-gray-400">
                {#each selected.programs as x}
                  <li>
                    <div class="flex items-center gap-x-2">
                      <span class="font-bold text-blue-400">({x.language})</span><CopyButton text={x.code} size={16} />
                    </div>
                    <pre
                      class="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 dark:bg-gray-800">{@html processAuthors(
                        syntaxHighlight(prepHtml(x.code))
                      )}</pre>
                  </li>
                {/each}
              </ol>
            </div>
          {/if}
          {#if selected.mathematica != null && selected.mathematica.length > 0}
            <div>
              <h3 class="mt-3 text-xl font-bold">Mathematica programs</h3>
              <pre class="ml-10 whitespace-pre-wrap break-words text-sm">{@html processAuthors(
                  syntaxHighlight(prepHtml(selected.mathematica.join("\n")))
                )}</pre>
            </div>
          {/if}
          {#if selected.comment != null && selected.comment.length > 0}
            <div>
              <h3 class="mt-3 text-xl font-bold">Comments ({selected.comment.length})</h3>
              <ol class="ml-10 list-decimal space-y-2 whitespace-pre-wrap marker:text-gray-400">
                {#each selected.comment as comment}
                  <li><OeisText text={comment} /></li>
                {/each}
              </ol>
            </div>
          {/if}
          {#if selected.links != null && selected.links.length > 0}
            <div>
              <h3 class="mt-3 text-xl font-bold">Links</h3>
              <ul class="ml-10 list-disc space-y-2 whitespace-pre-wrap">
                {#each selected.links as link}
                  <li>{@html link}</li>
                {/each}
              </ul>
            </div>
          {/if}
          <div>
            <h3 class="mt-3 text-xl font-bold">Crossrefs</h3>
            <ul class="ml-10 list-disc">
              {#each selected.xref as xref}
                <li>{@html processANumbers(xref)}</li>
              {/each}
            </ul>
          </div>
          <div>
            <h3 class="mt-3 text-xl font-bold">Keywords</h3>
            <div class="ml-10">{selected.keywords.join(", ")}</div>
          </div>
          {#if selected.author != null}
            <div>
              <h3 class="mt-3 text-xl font-bold">Author</h3>
              <div class="ml-10">
                {@html prepHtml(selected.author).replaceAll(
                  /(?: |^)_(.+?)_/g,
                  ' <a href="https://oeis.org/wiki/User:$1" target="_blank">$1</a>'
                )}
              </div>
            </div>
          {/if}
          <div>
            <h3 class="mt-3 text-xl font-bold">Created</h3>
            <div class="ml-10">{selected.created.toLocaleString()}</div>
          </div>
          <div>
            <h3 class="mt-3 text-xl font-bold">Updated</h3>
            <div class="ml-10">{selected.time.toLocaleString()}</div>
          </div>
        </div>
      </Resizable.Pane>
    {/if}
  </Resizable.PaneGroup>
{/if}
