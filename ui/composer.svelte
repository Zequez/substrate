<script lang="ts">
  import cx from "classnames";

  import BunchNavigation from "@center/experimental/BunchNavigation.svelte";
  import { addDelta } from "@center/Frame";

  import SS, {
    WHEEL_BUTTON,
    ALT_BUTTON,
    MAIN_BUTTON,
  } from "@stores/main.svelte";

  import {
    addDelta as addDeltaToPixels,
    addPixels,
    removePixels,
  } from "@stores/spaceColoring.svelte";

  import GhostBox from "./canvas/special-effects/GhostBox.svelte";
  import PixelsDisplay from "./canvas/special-effects/PixelsDisplay.svelte";
  import GridDisplay from "./canvas/special-effects/GridDisplay.svelte";
  import GridBox from "./canvas/special-effects/GridBox.svelte";
  import Frame from "./canvas/frames/Frame.svelte";

  import ColorPicker from "./hud/ColorPicker.svelte";
  import TrashBin from "./hud/TrashBin.svelte";
  import People from "./hud/People.svelte";
  import Tools from "./hud/Tools.svelte";
  import View from "./hud/View.svelte";

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
</script>

<!-- Experimental -->

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->

<!-- <BunchNavigation /> -->

<!-- HUD -->
<Tools />
<People />
<TrashBin
  onMouseMove={(ev) => S.ev.mousemove(ev, ["trash"])}
  onMouseUp={S.ev.mouseup}
  show={A.type === "moveFrame"}
  opened={A.type === "moveFrame" && A.trashing}
/>
{#if (!S.expandedFrame && S.tool.main === "art") || S.tool.alt === "art"}
  <ColorPicker
    mainColor={S.artToolSelectedColor.main}
    onPickMain={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "main", i])}
    altColor={S.artToolSelectedColor.alt}
    onPickAlt={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "alt", i])}
  />
{/if}
<View />

<!-- SPECIAL EFFECts -->

<PixelsDisplay
  pixels={resolvedPixels}
  buffer={S.spaceColoring.buffer}
  pos={S.pos}
  gridSize={S.grid.size}
  selecting={resolvedSelectingPixels}
/>
<GridDisplay />

<!-- CANVAS -->

<!-- Note: Not transformed and z-index is unset -->
<div
  bind:this={S.containerEl}
  onmouseup={S.ev.mouseup}
  onmousemove={S.ev.mousemove}
  onwheel={S.ev.wheel}
  onmousedown={(ev) => S.ev.containerMouseDown(ev)}
  oncontextmenu={(ev) => ev.preventDefault()}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing": S.currentActionIs("pan", "moveFrame"),
  })}
>
  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <div
    class={cx("absolute top-0 left-0 will-change-transform", {
      "z-frames-container": !S.expandedFrame,
    })}
    style={S.expandedFrame ? "" : S.ui.transform()}
  >
    <!-- <GridBox
      box={{ h: 10, w: 10, x: 0, y: 0 }}
      visual="bg-red-500 rounded-lg"
    /> -->

    <!-- THE FRAME SHOWN WHILE DRAGGING FOR CREATION -->
    {#if S.currentAction.type === "selecting"}
      {#if S.currentAction.createFrame}
        <GhostBox
          box={S.currentAction.boxNormalized}
          styl={S.currentAction.isValid ? "opaque" : "opaqueInvalid"}
        />
      {:else}
        <GhostBox box={S.currentAction.boxNormalized} styl={"faded"} />
      {/if}
    {/if}
    {#if S.selectedArea}
      {@const resultingBox =
        S.currentAction.type === "moveFrame"
          ? addDelta(S.selectedArea, S.currentAction.boxDelta)
          : S.selectedArea}
      <button
        aria-label="Pick up selected area"
        style={S.ui.boxStyle(resultingBox) + S.ui.boxBorderRadius}
        onmousedown={(ev) =>
          ev.button === MAIN_BUTTON
            ? S.ev.mousedown(ev, ["frame-picker", null])
            : null}
        class={cx(
          "z-selection-box b-2 absolute top-0 left-0 cursor-move",
          "bg-sky-500/10 b-sky-500/60"
        )}
      ></button>
    {/if}

    <!-- ALL THE CREATED FRAMES -->
    {#each S.viewportFrames as wrappedFrame (wrappedFrame.uuid)}
      <Frame {wrappedFrame} />
    {/each}
  </div>
</div>
