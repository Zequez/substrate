<script lang="ts">
  import cx from "classnames";
  import { type Component } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";

  import SquareIcon from "~icons/fa6-regular/square";
  import ExpandIcon from "~icons/fa6-solid/expand";
  import CompressIcon from "~icons/fa6-solid/compress";

  import HandToolClosedIcon from "~icons/fa6-solid/hand-back-fist";
  import HandToolIcon from "~icons/fa6-solid/hand";
  import SelectToolIcon from "~icons/fa6-solid/arrow-pointer";
  import FrameToolIcon from "~icons/fa6-solid/window-maximize";
  import ArtToolIcon from "~icons/fa6-solid/brush";
  import FavIcon from "~icons/fa6-solid/star";

  import SS, {
    WHEEL_BUTTON,
    ALT_BUTTON,
    MAIN_BUTTON,
    type ToolType,
  } from "../lib/stores/main.svelte";
  import { c } from "../lib/utils";
  import {
    addDelta as addDeltaToPixels,
    addPixels,
    removePixels,
  } from "../lib/stores/spaceColoring.svelte";

  import GhostBox from "./GhostBox.svelte";
  import PixelCanvas from "./spaceColoring/PixelCanvas.svelte";
  import ColorPicker from "./spaceColoring/ColorPicker.svelte";
  import TrashBin from "./TrashBin.svelte";
  import Profiles from "./Profiles.svelte";
  import { tooltip } from "../lib/tooltip";
  import Frame from "./Frame.svelte";
  import clients from "../lib/clients";
  import { addDelta } from "../lib/Frame";
  // import GenericDnaSandbox from "./GenericDnaSandbox.svelte";

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

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->

<!-- PIXELS -->

<PixelCanvas
  pixels={resolvedPixels}
  buffer={S.spaceColoring.buffer}
  pos={S.pos}
  gridSize={S.grid.size}
  selecting={resolvedSelectingPixels}
/>

{#if (!S.expandedFrame && S.tool.main === "art") || S.tool.alt === "art"}
  <!-- COLOR PICKER -->
  <ColorPicker
    mainColor={S.artToolSelectedColor.main}
    onPickMain={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "main", i])}
    altColor={S.artToolSelectedColor.alt}
    onPickAlt={(ev, i) => S.ev.click(ev, ["set-art-tool-color", "alt", i])}
  />
{/if}

<!-- TOOL BAR -->

<div
  class="z-hud p1 flex space-x-1 absolute top-2 left-1/2 -translate-x-1/2 h-10 rounded-md b b-black/10 shadow-md bg-gray-100"
>
  {#snippet toolButton(
    Icon: Component<SvelteHTMLElements["svg"]>,
    tooltipText: string,
    hotkey: string | null,
    tool: ToolType
  )}
    <button
      title={`${tooltipText} tool ${hotkey ? `— ${hotkey}` : ""}`}
      use:c={[
        "w-8 h-full flexcc rounded-md p2 relative text-black/70 b",
        {
          "bg-green-200 b-black/10": S.tool.main === tool,
          "bg-gray-200 b-black/0": S.tool.main !== tool,
        },
      ]}
      oncontextmenu={(ev) => (
        ev.preventDefault(), S.ev.click(ev, ["set-tool-alt", tool])
      )}
      onclick={(ev) =>
        ev.button === MAIN_BUTTON
          ? S.ev.click(ev, ["set-tool", tool])
          : ev.button === ALT_BUTTON
            ? S.ev.click(ev, ["set-tool-alt", tool])
            : null}
    >
      <Icon class="size-full" />
      {#if hotkey}
        <span class="absolute bottom-0 right-.5 text-[0.5rem]">{hotkey}</span>
      {/if}
      {#if S.tool.alt === tool}
        <span class="absolute bottom-.7 left-.5 text-[0.32rem]"
          ><FavIcon /></span
        >
      {/if}
    </button>
  {/snippet}

  {@render toolButton(
    S.currentAction.type === "pan" ? HandToolClosedIcon : HandToolIcon,
    "Hand",
    null,
    "hand"
  )}
  {@render toolButton(SelectToolIcon, "Selection", "1", "select")}
  {@render toolButton(FrameToolIcon, "Linked Frame", "2", "frame")}
  {@render toolButton(ArtToolIcon, "Art", "3", "art")}
</div>

<!-- PROFILES -->

<Profiles />

<!-- TRASH BUTTON -->

<TrashBin
  onMouseMove={(ev) => S.ev.mousemove(ev, ["trash"])}
  onMouseUp={S.ev.mouseup}
  show={A.type === "moveFrame"}
  opened={A.type === "moveFrame" && A.trashing}
/>

<!-- ZOOM INDICATOR AND RESET -->

{#snippet cornerButton(
  Content: Component<SvelteHTMLElements["svg"]> | string,
  tooltipText: string,
  action: (ev: MouseEvent) => void
)}
  <button
    class="px2 py1 bg-white rounded-md text-xs hover:bg-gray-100 b b-black/10 shadow-md hover:scale-105"
    onclick={action}
    use:tooltip={tooltipText}
  >
    {#if typeof Content === "string"}
      {Content}
    {:else}
      <Content class="size-full" />
    {/if}
  </button>
{/snippet}

<div class="absolute bottom-2 right-2 z-hud flex space-x-2">
  {#if !S.expandedFrame}
    {#if S.pos.z !== 1}
      {@render cornerButton(
        `${Math.round(S.pos.z * 100)}%`,
        "Reset zoom",
        S.ev.resetZoom
      )}
    {/if}
    {#if Object.keys(S.frames).length}
      {@render cornerButton(
        SquareIcon,
        "Fit all frames on the viewport",
        (ev) => S.ev.mousedown(ev, ["fit-all"])
      )}
    {/if}
  {/if}
  {#if !clients.weave}
    {@render cornerButton(
      S.isInFullscreen ? CompressIcon : ExpandIcon,
      "Enter fullscreen mode",
      (ev) => S.ev.mousedown(ev, ["toggle-fullscreen"])
    )}
  {/if}

  {#if S.expandedFrame}
    {@render cornerButton(CompressIcon, "Exit expanded frame", (ev) =>
      S.ev.mousedown(ev, ["expand-frame", null])
    )}
  {/if}
</div>

<!-- ZOOMABLE PANABLE CANVAS -->

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
  <!-- <Coral /> -->

  <!-- GRID PATTERN -->
  <canvas
    class="h-full w-full absolute top-0 left-0 z-grid pointer-events-none"
    bind:this={S.grid.el}
  ></canvas>

  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <div
    class={cx("absolute top-0 left-0", {
      "z-frames-container": !S.expandedFrame,
    })}
    style={S.expandedFrame ? "" : S.ui.transform()}
  >
    <!-- THE LITTLE SQUARE CURSOR -->
    <!-- {#if S.currentAction.type === "none"}
      {#if S.isOnGrid}
        <GhostBox box={S.mouse.box} lighter={true} />
      {/if}
    {/if} -->
    <!-- THE FRAME SHOWN WHILE DRAGGING FOR CREATION -->
    {#if S.currentAction.type === "selecting"}
      <GhostBox
        box={S.currentAction.boxNormalized}
        lighter={!S.currentAction.isValid}
      />
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
