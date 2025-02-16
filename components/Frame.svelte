<script lang="ts">
  import cx from "classnames";
  import { tick } from "svelte";
  import type { BoxedFrameWrapped } from "../lib/stores/main.svelte";
  import SS from "../lib/stores/main.svelte";
  import { c, stickyStyle } from "../lib/utils";
  import FrameContent from "./FrameContent.svelte";
  import FrameInteracting from "./FrameInteracting.svelte";
  import GhostBox from "./GhostBox.svelte";
  const { wrappedFrame }: { wrappedFrame: BoxedFrameWrapped } = $props();

  const S = SS.store;
  const A = $derived(S.currentAction);

  const uuid = $derived(wrappedFrame.uuid);
  const frame = $derived(wrappedFrame.value);

  const [box, validBox] = $derived(S.resolveFrameBox(uuid, frame));

  const isResizing = $derived(A.type === "resizeFrame" && A.uuid === uuid);
  const isMoving = $derived(
    A.type === "moveFrame" && A.uuids.indexOf(uuid) !== -1
  );
  const isTrashing = $derived(
    A.type === "moveFrame" && A.uuids.indexOf(uuid) !== -1 && A.trashing
  );
  const isExpanded = $derived(S.expandedFrame === uuid);
  const isBeingSelected = $derived(
    A.type === "createFrame"
      ? A.touchingFrames.indexOf(uuid) !== -1
      : S.framesSelected.indexOf(uuid) !== -1
  );
  const isLastInteracted = $derived(S.lastInteractionUuid === uuid);

  const boxStyle = $derived(S.ui.boxStyle(box));
  const transformOriginStyle = $derived(
    A.type === "moveFrame"
      ? `transform-origin: ${A.pickX * 100}% ${A.pickY * 100}%`
      : ""
  );

  let wasExpanded = $state<boolean>(false);

  $effect(() => {
    if (!isExpanded) {
      setTimeout(() => {
        wasExpanded = false;
      }, 1000);
    } else {
      wasExpanded = true;
    }
  });

  function frameZ() {
    if (isExpanded) return "z-expanded-frame";
    else if (isLastInteracted) return "z-focused-frame";
    else if (isMoving) return "z-moving-frame";
    else return "z-frame";
  }
</script>

<!-- Frame is not contained within a single element,
 but is made of of multiple layers on the same shared scope of other frames -->
<!-- This allow us, for example to have a z-index for shadows that is below all frames -->

<!-- Shadow frame element -->
<div
  class={cx("absolute top-0 left-0", {
    "z-frame-shadow": !isMoving,
    "duration-150 transition-property-[transform,width,height]":
      !isMoving && !isResizing && !wasExpanded && !isExpanded,
    "z-moving-frame-shadow transition-none": isMoving,
  })}
  style={isExpanded ? "" : boxStyle}
>
  <div
    use:stickyStyle={transformOriginStyle}
    use:c={[
      "size-full",
      "duration-150 transition-property-[transform,opacity,box-shadow]",
      {
        "scale-50": isTrashing,
        "shadow-[0px_0px_2px_3px_#0003] scale-100": !isMoving,
        "shadow-[0px_0px_2px_3px_#0002,0px_0px_10px_3px_#0005] scale-102":
          isMoving && !isTrashing,
      },
    ]}
    style={S.ui.boxBorderRadius}
  ></div>
</div>

<!-- Solid frame element z-40 -->
<div
  use:c={[
    "absolute top-0 left-0",
    frameZ(),
    {
      "duration-150 transition-property-[transform,width,height]":
        !isMoving && !isResizing && !wasExpanded && !isExpanded,
      "fixed! inset-0!": isExpanded,
    },
  ]}
  style={isExpanded ? "" : boxStyle}
>
  <!-- The nested transformation here allows us to shrink the frame when trashing it -->
  <div
    style={S.ui.boxBorderRadius}
    use:stickyStyle={transformOriginStyle}
    use:c={[
      "size-full",
      "duration-150 transition-transform",
      "bg-gray-100 b-gray-300 shadow-[inset_0px_0px_1px_0px_#0003]",
      {
        "scale-50 opacity-30": isTrashing,
        "scale-102 opacity-100": isMoving && !isTrashing,
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

{#if !isMoving && !isExpanded}
  <FrameInteracting {frame} {uuid} {boxStyle} />
{/if}
