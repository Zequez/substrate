<script lang="ts">
  import cx from "classnames";

  import SquareIcon from "~icons/fa6-regular/square";
  import ExpandIcon from "~icons/fa6-solid/expand";
  import CompressIcon from "~icons/fa6-solid/compress";

  import SS from "../lib/stores/main.svelte";

  import FrameContent from "./FrameContent.svelte";
  import FrameInteracting from "./FrameInteracting.svelte";
  import GhostBox from "./GhostBox.svelte";
  import PixelCanvas from "./spaceColoring/PixelCanvas.svelte";
  import ColorPicker from "./spaceColoring/ColorPicker.svelte";
  import TrashBin from "./TrashBin.svelte";
  import Profiles from "./Profiles.svelte";
  import { c, stickyStyle } from "../lib/utils";
  import { tooltip } from "../lib/tooltip";
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

<!-- COLOR PICKER -->
<ColorPicker
  color={S.spaceColoring.color}
  onPick={(ev, i) => S.ev.click(ev, ["set-pallette", i])}
/>

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

<div class="absolute bottom-2 right-2 z-100 flex space-x-2">
  {#if S.pos.z !== 1}
    <button
      class="px2 py1 bg-white rounded-md text-xs hover:bg-gray-100"
      onclick={S.ev.resetZoom}
      use:tooltip={"Reset zoom"}
    >
      {Math.round(S.pos.z * 100)}%
    </button>
  {/if}
  {#if Object.keys(S.frames).length}
    <button
      use:tooltip={"Fit all frames on the viewport"}
      class="bg-white px2 py1 rounded-md text-xs hover:bg-gray-100"
      onclick={(ev) => S.ev.mousedown(ev, ["fit-all"])}
    >
      <SquareIcon />
    </button>
  {/if}
  <button
    use:tooltip={"Enter fullscreen mode"}
    class="bg-white px2 py1 rounded-md text-xs hover:bg-gray-100"
    onclick={(ev) => S.ev.mousedown(ev, ["toggle-fullscreen"])}
    >{#if S.isInFullscreen}<CompressIcon />{:else}<ExpandIcon />{/if}</button
  >
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
  <div class="absolute top-0 left-0 z-40" style={S.ui.transform()}>
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
      {@const uuid = wrappedFrame.uuid}
      {@const frame = wrappedFrame.value}
      {@const [box, validBox] = S.resolveFrameBox(uuid, frame)}

      {@const resizing = A.type === "resizeFrame" && A.uuid === uuid}

      {@const moving = A.type === "moveFrame" && A.uuids.indexOf(uuid) !== -1}
      {@const trashing = moving && A.uuids.indexOf(uuid) !== -1 && A.trashing}

      {@const isBeingSelected =
        A.type === "createFrame"
          ? A.touchingFrames.indexOf(uuid) !== -1
          : S.framesSelected.indexOf(uuid) !== -1}

      {@const boxStyle = S.ui.boxStyle(box)}
      {@const transformOriginStyle = moving
        ? `transform-origin: ${A.pickX * 100}% ${A.pickY * 100}%`
        : ""}

      <!-- Shadow only element z-30 => So shadows don't overlap over other frames -->
      <div
        class={cx("absolute top-0 left-0", {
          "z-30": !moving,
          "duration-150 transition-property-[transform,width,height]":
            !moving && !resizing,
          "z-50 transition-none": moving,
        })}
        style={boxStyle}
      >
        <div
          use:stickyStyle={transformOriginStyle}
          use:c={[
            "size-full",
            "duration-150 transition-property-[transform,opacity,box-shadow]",
            {
              "scale-50": trashing,
              "shadow-[0px_0px_2px_3px_#0003] scale-100": !moving,
              "shadow-[0px_0px_2px_3px_#0002,0px_0px_10px_3px_#0005] scale-102":
                moving && !trashing,
            },
          ]}
          style={S.ui.boxBorderRadius}
        ></div>
      </div>

      <!-- Solid frame element z-40 -->
      <div
        use:c={[
          "absolute top-0 left-0",
          {
            "z-40": !moving,
            "duration-150 transition-property-[transform,width,height]":
              !moving && !resizing,
            "z-60": moving,
            "z-80": S.lastInteractionUuid === uuid,
          },
        ]}
        style={boxStyle}
      >
        <div
          style={S.ui.boxBorderRadius}
          use:stickyStyle={transformOriginStyle}
          use:c={[
            "size-full",
            "duration-150 transition-transform",
            "bg-gray-100 b-gray-300 shadow-[inset_0px_0px_1px_0px_#0003]",
            {
              "scale-50 opacity-30": trashing,
              "scale-102 opacity-100": moving && !trashing,
            },
          ]}
        >
          {#if isBeingSelected}
            <button
              aria-label="Move selected frames"
              onmousedown={(ev) =>
                S.ev.mousedown(ev, ["frame-picker", S.framesSelected])}
              class="size-full bg-blue-500/50 absolute z-150 cursor-move"
              style={S.ui.boxBorderRadius}
            ></button>
          {/if}
          <FrameContent {frame} {uuid} />
        </div>
      </div>

      {#if validBox}
        <GhostBox box={validBox} lighter={false} />
      {/if}

      {#if !moving}
        <FrameInteracting {frame} {uuid} {boxStyle} />
      {/if}
    {/each}
  </div>
</div>
