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
    if (S.currentAction.type !== "none") {
      document.body.classList.add("select-none");
    } else {
      document.body.classList.remove("select-none");
    }
  });

  const A = $derived(S.currentAction);

  const resolvedSelectingPixels = $derived(
    A.type === "selecting"
      ? A.touchingPixels
      : A.type === "moveFrame"
        ? addDeltaToPixels(S.pixelsSelected, A.lastValidBoxDelta)
        : S.pixelsSelected
  );
  const resolvedPixels = $derived(
    A.type === "moveFrame" && A.pixels.length !== 0
      ? addPixels(
          removePixels(S.pixelsInViewport, A.pixels),
          resolvedSelectingPixels
        )
      : S.pixelsInViewport
  );

  WASDSpeedControl((direction, distance) => {
    S.command("move-towards", direction, distance);
  });
</script>

<!-- Experimental -->

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->
<!-- <BunchNavigation /> -->

<!-- HUD -->
<ToolsHud
  onPickTool={(tool, boundTo) => S.command("set-tool-to", tool, boundTo)}
/>
<PeopleHud />
<TrashBinHud
  onMouseMove={(ev) => S.ev.mousemove(ev, ["trash"])}
  onMouseUp={S.ev.mouseup}
  show={A.type === "moveFrame"}
  opened={A.type === "moveFrame" && A.trashing}
/>
{#if (!S.expandedFrame && S.tool.main === "art") || S.tool.alt === "art"}
  <ColorPickerHud
    mainColor={S.artToolSelectedColor.main}
    onPickMain={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "main", i])}
    altColor={S.artToolSelectedColor.alt}
    onPickAlt={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "alt", i])}
  />
{/if}
<ViewHud />

<!-- SPECIAL EFFECts -->

<PixelsDisplay
  pixels={resolvedPixels}
  buffer={S.spaceColoring.buffer}
  pos={S.pos}
  gridSize={S.grid.size}
  selecting={resolvedSelectingPixels}
/>
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
  <!-- <GridBox box={{ h: 10, w: 10, x: 0, y: 0 }} visual="bg-white" /> -->

  {#if S.selecting}
    <GridBox box={S.selecting.box} cx={"bg-sky-500/10 b-sky-500/60"} />
  {/if}

  {#if S.creatingFrame}
    <GridBox
      box={S.creatingFrame.box}
      cx={[
        {
          "bg-gray-100 b-black/10": S.creatingFrame.isValid,
          "bg-gray-100/50 b-black/10": !S.creatingFrame.isValid,
        },
      ]}
    />
  {/if}

  {#if S.selectedPixelsBox}
    <GridBox
      layer="z-selection-box"
      box={S.selectedPixelsBox}
      cx={"cursor-move b2 bg-sky-500/10 b-sky-500/60"}
      onmousedown={(ev) =>
        ev.button === MAIN_BUTTON
          ? S.ev.mousedown(ev, ["frame-picker", null])
          : null}
    />
  {/if}

  <!-- ALL THE CREATED FRAMES -->
  {#each S.viewportFrames as wrappedFrame (wrappedFrame.uuid)}
    <Frame {wrappedFrame} />
  {/each}
</SpaceViewContainer>
