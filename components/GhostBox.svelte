<script lang="ts">
  import cx from "classnames";
  import { type Box } from "../lib/Frame";
  import SS from "../lib/stores/main.svelte";

  const S = SS.store;

  let { box, lighter = false }: { box: Box; lighter?: boolean } = $props();
  let boxStyle = $derived(S.ui.boxStyle(box));
</script>

<div
  style={boxStyle}
  class={cx(
    "z-ghostbox b-2 absolute top-0 left-0 rounded-md bg-sky-500/10 b-sky-500/60 pointer-events-none",
    {
      "bg-sky-500/10 b-sky-500/60": lighter,
      "bg-sky-500/50 b-sky-500/100": !lighter,
    }
  )}
></div>
