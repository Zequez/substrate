<script lang="ts">
  import cx from "classnames";
  import TrashIcon from "~icons/fa6-solid/trash";
  import SquareIcon from "~icons/fa6-regular/square";
  import ExpandIcon from "~icons/fa6-solid/expand";
  import CompressIcon from "~icons/fa6-solid/compress";

  import SS from "../lib/stores/main.svelte";
  import profiles from "../lib/stores/profiles.svelte";
  import { type BoxedFrame, type Box, isTouching } from "../lib/Frame";
  import FrameContent from "./FrameContent.svelte";
  import FrameInteracting from "./FrameInteracting.svelte";
  import GhostBox from "./GhostBox.svelte";
  import { c, stickyStyle } from "../lib/utils";
  // import Coral from "./Coral.svelte";
  // import GenericDnaSandbox from "./GenericDnaSandbox.svelte";

  const S = SS.store;
  S.mountInit();

  function resolveFrameBox(uuid: string, frame: BoxedFrame): [Box, Box | null] {
    if (
      S.currentAction.type === "none" ||
      S.currentAction.type === "pan" ||
      S.currentAction.type === "createFrame" ||
      S.currentAction.uuid !== uuid
    ) {
      return [frame.box, null];
    }

    if (S.currentAction.type === "moveFrame") {
      const resolved = {
        ...frame.box,
        x: frame.box.x + S.currentAction.boxDelta.x,
        y: frame.box.y + S.currentAction.boxDelta.y,
      };
      if (!S.currentAction.isValid) {
        const resolvedValid = {
          ...frame.box,
          x: frame.box.x + S.currentAction.lastValidBoxDelta.x,
          y: frame.box.y + S.currentAction.lastValidBoxDelta.y,
        };
        return [resolved, resolvedValid];
      } else {
        return [resolved, null];
      }
    } else if (S.currentAction.type === "resizeFrame") {
      return [S.currentAction.lastValidBox, null];
    } else {
      return [frame.box, null];
    }
  }

  $effect(() => {
    if (S.currentAction.type !== "none") {
      document.body.classList.add("select-none");
    } else {
      document.body.classList.remove("select-none");
    }
  });
</script>

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->

<!-- PROFILES -->

<div class="absolute top-0 right-0 bg-blue-500 rounded-bl-md z-120">
  {#each Object.entries(profiles.participantsProfiles) as [agent, profile]}
    {#if profile === "unknown" || profile === "none"}
      {agent.slice(0, 5)}
    {:else}
      {profile.nickname}
    {/if}
  {/each}
</div>

<!-- TRASH BUTTON -->

<button
  class={cx(
    "h-20 w-20 z-100 transition-opacity absolute top-4 left-1/2 shadow-lg rounded-full -transform-x-1/2 absolute",
    {
      "opacity-0 pointer-events-none": S.currentAction.type !== "moveFrame",
      "opacity-100": S.currentAction.type === "moveFrame",
    }
  )}
  onmousemove={(ev) => S.ev.mousemove(ev, ["trash"])}
  onmouseup={S.ev.mouseup}
>
  <div
    class={cx(
      "flexcc bg-red-500 b-2 b-black/5 relative z-20 text-white transition-all transform-origin-top-right transition-duration-200 text-2xl h-full w-full rounded-full ",
      {
        "opacity-80": S.currentAction.type !== "moveFrame",
        "opacity-100": S.currentAction.type === "moveFrame",
        "scale-85! translate-x-[5px] -translate-y-[5px] skew-x-[8deg] skew-y-[8deg]":
          S.currentAction.type === "moveFrame" && S.currentAction.trashing,
      }
    )}
  >
    <TrashIcon />
  </div>
  <div
    class={cx(
      "h-full w-full absolute z-10 top-0 left-0 bg-gray-800 b-2 b-white/10 rounded-full",
      {
        "opacity-80": S.currentAction.type !== "moveFrame",
        "opacity-100": S.currentAction.type === "moveFrame",
      }
    )}
  ></div>
</button>

<!-- ZOOM INDICATOR AND RESET -->

<div class="absolute bottom-2 right-2 z-100 flex space-x-2">
  {#if S.pos.z !== 1}
    <button
      class="px2 py1 bg-white rounded-md text-xs hover:bg-gray-100"
      onclick={S.ev.resetZoom}
    >
      {Math.round(S.pos.z * 100)}%
    </button>
  {/if}
  {#if Object.keys(S.frames).length}
    <button
      title="Fit all frames on the viewport"
      class="bg-white px2 py1 rounded-md text-xs hover:bg-gray-100"
      onclick={(ev) => S.ev.mousedown(ev, ["fit-all"])}
    >
      <SquareIcon />
    </button>
  {/if}
  <button
    title="Enter full screen mode"
    class="bg-white px2 py1 rounded-md text-xs hover:bg-gray-100"
    onclick={(ev) => S.ev.mousedown(ev, ["toggle-fullscreen"])}
    >{#if S.isInFullscreen}<CompressIcon />{:else}<ExpandIcon />{/if}</button
  >
</div>

<!-- ZOOMABLE PANABLE CANVAS -->

<div
  onmouseup={S.ev.mouseup}
  onmousemove={S.ev.mousemove}
  onwheel={S.ev.wheel}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing": S.currentActionIs("pan", "moveFrame"),
  })}
>
  <!-- <Coral /> -->

  <!-- GRID PATTERN -->
  <canvas
    onmousedown={S.ev.mousedown}
    class="h-full w-full absolute top-0 left-0 z-10"
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
    {#each Object.entries(S.frames) as [uuid, frameWrapper] (uuid)}
      {#if S.frameIsInViewport(uuid)}
        {@const frame = frameWrapper.value}
        {@const [box, validBox] = resolveFrameBox(uuid, frame)}
        {@const resizing =
          S.currentAction.type === "resizeFrame" &&
          S.currentAction.uuid === uuid}
        {@const moving =
          S.currentAction.type === "moveFrame" && S.currentAction.uuid === uuid}
        {@const boxStyle = S.ui.boxStyle(box)}
        {@const transformOriginStyle = moving
          ? `transform-origin: ${S.currentAction.pickX * 100}% ${S.currentAction.pickY * 100}%`
          : ""}
        {@const trashing =
          S.currentAction.type === "moveFrame" &&
          S.currentAction.uuid === uuid &&
          S.currentAction.trashing}
        {@const borderRadius = (1 / S.pos.z) * (S.pos.z > 0.2 ? 6 : 4)}

        <!-- Shadow only element z-30 => So shadows don't overlap over other frames -->
        <div
          class={cx("absolute top-0 left-0", {
            "z-30": !moving,
            "transition-transform": !moving && !resizing,
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
            style={`border-radius: ${borderRadius}px`}
          ></div>
        </div>

        <!-- Solid frame element z-40 -->
        <div
          class={cx("absolute top-0 left-0", {
            "z-40": !moving,
            "transition-transform": !moving && !resizing,
            "z-60 transition-none": moving,
            "z-80": S.lastInteractionUuid === uuid,
          })}
          style={boxStyle}
        >
          <div
            style={`border-radius: ${borderRadius}px`}
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
            <FrameContent {frame} {uuid} />
          </div>
        </div>

        {#if validBox}
          <GhostBox box={validBox} lighter={false} />
        {/if}

        <FrameInteracting {frame} {uuid} {boxStyle} />
      {/if}
    {/each}
  </div>
</div>
