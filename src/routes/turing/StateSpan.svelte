<script lang="ts">
  import { getTmStateColorCss, stateToString } from "./turing"

  interface Props {
    state: number
  }

  let { state }: Props = $props()
</script>

<span style="color: {getTmStateColorCss(state)}">{stateToString(state)}</span>
