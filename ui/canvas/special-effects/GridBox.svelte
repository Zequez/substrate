<script lang="ts">
  import { type Box } from "@center/Frame";
  import SS from "@stores/main.svelte";
  import {
    styleCommand,
    type CxDefPlus,
    type CxDef,
    cx as classnames,
  } from "@center/snippets";

  const S = SS.store;

  // const presets = {
  //   ethereal: "bg-blue-500/40 b-3 b-blue-500",
  // };

  let {
    box,
    // preset,
    style,
    cx,
    layer,
    children,
    onmousedown,
  }: {
    box: Box;
    cx?: CxDef | string;
    style?: string;
    children?: any;
    layer?: string;
    // preset?: keyof typeof presets;
    onmousedown?: (ev: MouseEvent) => void;
  } = $props();

  // function replacePreset(s: string) {
  //   if (s.startsWith(".")) {
  //     const match = s.match(/\.(\S+)/);
  //     if (match && presets[match[1] as keyof typeof presets]) {
  //       return presets[match[1] as keyof typeof presets];
  //     }
  //   } else {
  //     return s;
  //   }
  // }

  let boxStyle = $derived(S.ui.boxStyle(box));
  let mergedStyles = $derived(
    [boxStyle, S.ui.boxBorderRadius, style || ""].join(";")
  );
  // let askedVisual = $derived.by(() => {
  //   if (Array.isArray(visual)) {
  //     if (typeof visual[0] === "string" && visual[0].startsWith(".")) {
  //       const newVisual = [...visual];
  //       newVisual[0] = replacePreset(visual[0]);
  //       return newVisual;
  //     } else {
  //       return visual;
  //     }
  //   } else if (typeof visual === "string") {
  //     if (visual.startsWith(".")) {
  //       return [replacePreset(visual)];
  //     } else {
  //       return [visual];
  //     }
  //   } else {
  //     return [];
  //   }
  // });

  // let styleParameters: CxDefPlus = $derived([
  //   "absolute top-0 left-0",
  //   // presets[preset!],
  //   layer ? layer : "z-canvas-top",
  //   [boxStyle, S.ui.boxBorderRadius],
  //   ...(visual ? (typeof visual === "string" ? [visual] : visual) : []),
  // ]);
  // let [classes, cssText] = $derived(styleCommand(...styleParameters));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  style={mergedStyles}
  class={classnames(
    "absolute top-0 left-0",
    ...(Array.isArray(cx) ? cx : [cx])
  )}
  {onmousedown}
>
  {@render children?.()}
</div>
