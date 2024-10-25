<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte"
  import { page } from "$app/stores"
  import { cn } from "$lib/utils"

  interface Props {
    href: string
    class?: string
    children: Snippet
  }

  const { href, class: className, children, ...props }: Props = $props()

  const subpath = $derived($page.url.pathname.match(/[^\/]+/g))
  const isActive = $derived(href === $page.url.pathname || href === "/" + subpath?.[0])
</script>

<a
  {href}
  class={cn(
    "inline-block border-b-4 px-4 py-2 font-medium",
    className,
    isActive ? "border-b-[--header-accent] text-[--header-accent]" : "border-b-transparent"
  )}
  {...props}
>
  {@render children()}
</a>
