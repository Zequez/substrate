<script lang="ts">
  import cx from "classnames";
  import { type Component } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";

  import SquareIcon from "~icons/fa6-regular/square";
  import ExpandIcon from "~icons/fa6-solid/expand";
  import CompressIcon from "~icons/fa6-solid/compress";

  import SS from "../lib/stores/main.svelte";

  import GhostBox from "./GhostBox.svelte";
  import PixelCanvas from "./spaceColoring/PixelCanvas.svelte";
  import ColorPicker from "./spaceColoring/ColorPicker.svelte";
  import TrashBin from "./TrashBin.svelte";
  import Profiles from "./Profiles.svelte";
  import { tooltip } from "../lib/tooltip";
  import Frame from "./Frame.svelte";
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
</script>

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->

<!-- PIXELS -->

<PixelCanvas
  pixels={S.pixelsInViewport}
  buffer={S.spaceColoring.buffer}
  pos={S.pos}
  gridSize={S.grid.size}
/>

{#if !S.expandedFrame}
  <!-- COLOR PICKER -->
  <ColorPicker
    color={S.spaceColoring.color}
    onPick={(ev, i) => S.ev.click(ev, ["set-pallette", i])}
  />
{/if}

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

<div class="absolute bottom-2 right-2 z-150 flex space-x-2">
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
  {@render cornerButton(
    S.isInFullscreen ? CompressIcon : ExpandIcon,
    "Enter fullscreen mode",
    (ev) => S.ev.mousedown(ev, ["toggle-fullscreen"])
  )}

  {#if S.expandedFrame}
    {@render cornerButton(CompressIcon, "Exit expanded frame", (ev) =>
      S.ev.mousedown(ev, ["expand-frame", null])
    )}
  {/if}
</div>

<!-- ZOOMABLE PANABLE CANVAS -->

<div
  bind:this={S.containerEl}
  onmouseup={S.ev.mouseup}
  onmousemove={S.ev.mousemove}
  onwheel={S.ev.wheel}
  onmousedown={(ev) =>
    S.ev.mousedown(
      ev,
      ev.button === 0
        ? ["create-frame"]
        : ev.button === 1
          ? ["pan"]
          : ["paint-start"]
    )}
  oncontextmenu={(ev) => ev.preventDefault()}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing": S.currentActionIs("pan", "moveFrame"),
  })}
>
  <!-- <Coral /> -->

  <!-- GRID PATTERN -->
  <canvas
    class="h-full w-full absolute top-0 left-0 z-10 pointer-events-none"
    bind:this={S.grid.el}
  ></canvas>

  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <div
    class={cx("absolute top-0 left-0 z-40", {
      "z-120!": S.expandedFrame,
    })}
    style={S.expandedFrame ? "" : S.ui.transform()}
  >
    <!-- THE LITTLE SQUARE CURSOR -->
    {#if S.currentAction.type === "none"}
      {#if S.isOnGrid}
        <GhostBox box={S.mouse.box} lighter={true} />
      {/if}
      <!-- THE FRAME SHOWN WHILE DRAGGING FOR CREATION -->
    {:else if S.currentAction.type === "createFrame"}
      <GhostBox
        box={S.currentAction.boxNormalized}
        lighter={!S.currentAction.isValid}
      />
    {/if}

    <!-- ALL THE CREATED FRAMES -->
    {#each S.viewportFrames as wrappedFrame (wrappedFrame.uuid)}
      <Frame {wrappedFrame} />
    {/each}
  </div>
</div>
