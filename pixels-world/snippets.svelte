<script lang="ts">
  // import {
  //   addDelta as addDeltaToPixels,
  //   addPixels,
  //   removePixels,
  // } from "pixels-world/spaceColoring.svelte";
  // import PixelsDisplay from "../pixels-world/PixelsDisplay.svelte";
  // import ColorPickerHud from "../pixels-world/ColorPicker.svelte";
  // Coloring pixels stuff
  // let colorPixels = spaceColoring.createStore();
  // const colorPixelsInViewport: PixelsFlat[] = $derived.by(() => {
  //   return colorPixels.pixels.filter(([x, y]) => {
  //     const vp = ui.vpBox;
  //     return x >= vp.x && x <= vp.x + vp.w && y >= vp.y && y <= vp.y + vp.h;
  //   });
  // });
  // let artToolSelectedColor = $state<{
  //   main: number;
  //   alt: number;
  // }>({ main: 1, alt: 0 });
  // const resolvedSelectingPixels = $derived(
  //   A.type === "selecting"
  //     ? A.touchingPixels
  //     : A.type === "moveFrame"
  //       ? addDeltaToPixels(S.pixelsSelected, A.lastValidBoxDelta)
  //       : S.pixelsSelected
  // );
  // const resolvedPixels = $derived(
  //   A.type === "moveFrame" && A.pixels.length !== 0
  //     ? addPixels(
  //         removePixels(S.pixelsInViewport, A.pixels),
  //         resolvedSelectingPixels
  //       )
  //     : S.pixelsInViewport
  // );
</script>

<!-- {#if (!S.expandedFrame && S.tool.main === "art") || S.tool.alt === "art"}
  <ColorPickerHud
    mainColor={S.artToolSelectedColor.main}
    onPickMain={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "main", i])}
    altColor={S.artToolSelectedColor.alt}
    onPickAlt={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "alt", i])}
  />
{/if} -->

<!-- <PixelsDisplay
  pixels={resolvedPixels}
  buffer={S.spaceColoring.buffer}
  pos={S.pos}
  gridSize={S.grid.size}
  selecting={resolvedSelectingPixels}
/> -->
<!-- {#if S.selectedPixelsBox}
    <GridBox
      layer="z-selection-box"
      box={S.selectedPixelsBox}
      cx={"cursor-move b2 bg-sky-500/10 b-sky-500/60"}
      onmousedown={(ev) =>
        ev.button === MAIN_BUTTON
          ? S.ev.mousedown(ev, ["frame-picker", null])
          : null}
    />
  {/if} -->
