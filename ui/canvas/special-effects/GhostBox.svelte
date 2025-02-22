<script lang="ts">
  import cx from "classnames";
  import { type Box } from "@center/Frame";
  import SS from "@stores/main.svelte";

  const S = SS.store;

  let {
    box,
    styl = "faded",
  }: { box: Box; styl?: "faded" | "bright" | "opaque" | "opaqueInvalid" } =
    $props();
  let boxStyle = $derived(S.ui.boxStyle(box));

  const STYLES = {
    faded: "bg-sky-500/10 b-sky-500/60",
    bright: "bg-sky-500/10 b-sky-500/60",
    opaque: "bg-gray-100 b-black/10",
    opaqueInvalid: "bg-gray-100/50 b-black/10",
  };
</script>

<div
  style={boxStyle + S.ui.boxBorderRadius}
  class={cx(
    "z-ghostbox b-2 absolute top-0 left-0 rounded-md pointer-events-none",
    STYLES[styl]
  )}
></div>
