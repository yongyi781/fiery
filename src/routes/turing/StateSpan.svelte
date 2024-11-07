<script lang="ts">
  import { mode } from "mode-watcher"
  import { getTmStateColorCss, stateToString } from "./turing"

  interface Props {
    state: number
  }

  let { state }: Props = $props()
</script>

<span style="color: {getTmStateColorCss(state, $mode)}">{stateToString(state)}</span>
