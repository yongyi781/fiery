<script lang="ts">
  import { ModeWatcher } from "mode-watcher"
  import "../app.css"
  import Header from "./Header.svelte"
  import { page } from "$app/stores"

  let { children } = $props()

  const faviconPath = $page.url.pathname.startsWith("/turing") ? "/turing/favicon.png" : "/favicon.png"
</script>

<svelte:head>
  <link rel="icon" href={faviconPath} />
</svelte:head>

<ModeWatcher disableTransitions={false} />

<div
  class="flex h-screen flex-col bg-gradient-to-r from-gray-50 via-background to-gray-50 dark:from-gray-950 dark:via-background dark:to-gray-950"
>
  <Header />

  <main class="mx-auto flex w-full flex-1 flex-col bg-[--bg] p-4">
    {@render children()}
  </main>

  <footer class="flex flex-col items-center justify-center p-3 sm:px-0">
    <p class="text-xs text-gray-600">© 2024 Fiery</p>
  </footer>
</div>
