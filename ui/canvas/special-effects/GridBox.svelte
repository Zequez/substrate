<script lang="ts">
  import { type Box } from "@center/Frame";
  import SS from "@stores/main.svelte";
  import { styleCommand, type CxDefPlus } from "@center/snippets";

  const S = SS.store;

  let {
    box,
    visual,
    children,
  }: { box: Box; visual: CxDefPlus | string; children?: any } = $props();

  let boxStyle = $derived(S.ui.boxStyle(box));
  let askedVisual = $derived(typeof visual === "string" ? [visual] : visual);
  let styleParameters = $derived([
    boxStyle,
    S.ui.boxBorderRadius,
    ...askedVisual,
  ]);
  let [classes, cssText] = $derived(styleCommand(...styleParameters));
</script>

<div style={cssText} class={classes}>
  {@render children?.()}
</div>
