<script lang="ts">
  import { ModeWatcher } from "mode-watcher"
  import "../app.css"
  import Header from "./Header.svelte"

  let { children } = $props()
</script>

<ModeWatcher />

<div
  class="flex h-screen flex-col bg-gradient-to-r from-gray-50 via-background to-gray-50 dark:from-gray-950 dark:via-background dark:to-gray-950"
>
  <Header />

  <main class="mx-auto flex w-full flex-1 flex-col bg-[--bg] p-4">
    {@render children()}
  </main>

  <footer class="flex flex-col items-center justify-center p-3 sm:px-0">
    <p>© 🤣</p>
  </footer>
</div>
