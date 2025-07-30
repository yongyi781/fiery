<script lang="ts">
  import Moon from "@lucide/svelte/icons/moon"
  import Sun from "@lucide/svelte/icons/sun"
  import { toggleMode } from "mode-watcher"
  import HeaderLink from "./HeaderLink.svelte"
</script>

<header class="bg-white px-4 shadow-md dark:bg-slate-800">
  <nav class="flex items-center justify-between">
    <h2 class="text-lg"><a href="/">Fiery's Things</a></h2>
    <ul class="relative flex items-center justify-center">
      <li><HeaderLink href="/" class="px-4">Home</HeaderLink></li>
      <li><HeaderLink href="/oeis" class="px-4">OEIS</HeaderLink></li>
      <li>
        <HeaderLink href="/turing" class="px-4">Turing Machine Visualizer</HeaderLink>
      </li>
    </ul>
    <div class="flex items-center">
      <button type="button" class="mr-6" onclick={toggleMode}>
        <Sun class="h-[1.2rem] w-[1.2rem] transition-all dark:hidden" />
        <Moon class="hidden h-[1.2rem] w-[1.2rem] transition-all dark:inline" />
        <span class="sr-only">Toggle theme</span>
      </button>
      <a href="https://github.com/yongyi781/fiery" target="_blank" title="GitHub repository for this website">
        <span class="sr-only">GitHub repository for this website</span>
        <svg viewBox="0 0 16 16" aria-hidden="true" width="32" height="32"
          ><path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          ></path></svg
        >
      </a>
    </div>
  </nav>
</header>
