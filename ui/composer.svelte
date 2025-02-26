<script lang="ts">
  import cx from "classnames";

  import { addDelta } from "@center/Frame";

  import SS, { MAIN_BUTTON } from "@stores/main.svelte";

  import {
    addDelta as addDeltaToPixels,
    addPixels,
    removePixels,
  } from "@stores/spaceColoring.svelte";

  import SpaceViewContainer from "./canvas/SpaceView.svelte";
  import PixelsDisplay from "./canvas/special-effects/PixelsDisplay.svelte";
  import GridDisplay from "./canvas/special-effects/GridDisplay.svelte";

  import ColorPickerHud from "./hud/ColorPicker.svelte";
  import TrashBinHud from "./hud/TrashBin.svelte";
  import PeopleHud from "./hud/People.svelte";
  import ToolsHud from "./hud/Tools.svelte";
  import ViewHud from "./hud/View.svelte";

  import GridBox from "./canvas/special-effects/GridBox.svelte";
  import Frame from "./canvas/frames/Frame.svelte";

  // import SpeedControl from "./SpeedControl.svelte";
  import WASDSpeedControl from "./WASDSpeedControl";

  const S = SS.store;
  S.mountInit();

  $effect(() => {
    if (S.dragState.type !== "none") {
      document.body.classList.add("select-none");
    } else {
      document.body.classList.remove("select-none");
    }
  });

  // const A = $derived(S.currentAction);

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

  WASDSpeedControl((direction, distance) => {
    S.cmd("move-towards", direction, distance);
  });
</script>

<!-- Experimental -->

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->
<!-- <BunchNavigation /> -->

<!-- HUD -->
<ToolsHud
  onClickTool={(tool, boundTo) => S.cmd("set-tool-to", tool, boundTo)}
/>
<PeopleHud />
<TrashBinHud
  onMouseMove={S.ev.mousemove("trash")}
  onMouseUp={S.ev.mouseup("trash")}
  show={S.dragState.type === "movingFrames"}
  opened={S.dragState.type === "movingFrames" && S.dragState.trashing}
/>
<!-- {#if (!S.expandedFrame && S.tool.main === "art") || S.tool.alt === "art"}
  <ColorPickerHud
    mainColor={S.artToolSelectedColor.main}
    onPickMain={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "main", i])}
    altColor={S.artToolSelectedColor.alt}
    onPickAlt={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "alt", i])}
  />
{/if} -->
<ViewHud />

<!-- SPECIAL EFFECts -->

<!-- <PixelsDisplay
  pixels={resolvedPixels}
  buffer={S.spaceColoring.buffer}
  pos={S.pos}
  gridSize={S.grid.size}
  selecting={resolvedSelectingPixels}
/> -->
<GridDisplay
  x={S.pos.x}
  y={S.pos.y}
  z={S.pos.z}
  w={S.pos.w}
  h={S.pos.h}
  units={S.grid.size}
  color="#fff"
/>

<!-- CANVAS -->

<!-- Note: Not transformed and z-index is unset -->
<SpaceViewContainer
  x={S.pos.x}
  y={S.pos.y}
  z={S.pos.z}
  w={S.pos.w}
  h={S.pos.h}
  units={S.grid.size}
>
  <!-- <PannableSurface
    onPan={(x, y) => S.cmd("move-towards", x, y)}
    boundTo={{
      "space+main": S.tool.main !== "hand",
      main: S.tool.main === "hand",
      alt: S.tool.alt === "hand",
      middle: true,
    }}
  /> -->
  <!-- <GridBox box={{ h: 10, w: 10, x: 0, y: 0 }} visual="bg-white" /> -->

  {#if S.dragState.type === "selecting"}
    <GridBox
      box={S.dragState.boxNormalized}
      cx={"bg-sky-500/10 b-sky-500/60"}
    />
  {/if}

  {#if S.dragState.type === "creatingFrame"}
    <GridBox
      box={S.dragState.boxNormalized}
      cx={[
        {
          "bg-gray-100 b-black/10": S.dragState.isValid,
          "bg-gray-100/50 b-black/10": !S.dragState.isValid,
        },
      ]}
    />
  {/if}

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

  <!-- ALL THE CREATED FRAMES -->
  {#each S.viewportFrames as wrappedFrame (wrappedFrame.uuid)}
    <Frame {wrappedFrame} />
  {/each}
</SpaceViewContainer>
