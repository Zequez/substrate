<script lang="ts">
  import cx from "classnames";
  import ExpandIcon from "~icons/fa6-solid/expand";

  import { c } from "@center/snippets";

  import type { BoxedFrameWrapped } from "@stores/main.svelte";
  import SS from "@stores/main.svelte";
  import assets from "@stores/assets.svelte";

  import Substrate from "../../composer.svelte";

  import FrameInteracting from "./FrameInteracting.svelte";
  import FrameEmbed from "./FrameEmbed.svelte";
  import FrameAssetInfo from "./FrameAssetInfo.svelte";
  import GridBox from "../special-effects/GridBox.svelte";

  const { wrappedFrame }: { wrappedFrame: BoxedFrameWrapped } = $props();

  const S = SS.store;
  const A = $derived(S.dragState);

  const uuid = $derived(wrappedFrame.uuid);
  const frame = $derived(wrappedFrame.value);

  const [box, validBox] = $derived(S.resolveFrameBox(uuid, frame));

  const isResizing = $derived(A.type === "resizingFrame" && A.uuid === uuid);
  const isMoving = $derived(
    A.type === "movingFrames" &&
      S.framesSelected.indexOf(uuid) !== -1 &&
      A.moved
  );
  const isTrashing = $derived(
    A.type === "movingFrames" &&
      S.framesSelected.indexOf(uuid) !== -1 &&
      A.trashing
  );
  const isExpanded = $derived(S.expandedFrame === uuid);

  const isSelected = $derived(
    A.type === "selecting"
      ? A.touchingFrames.indexOf(uuid) !== -1
      : S.framesSelected.indexOf(uuid) !== -1
  );
  const isLastInteracted = $derived(S.lastInteractionUuid === uuid);
  const isFocused = $derived(S.focusedFrames.indexOf(uuid) !== -1);
  const isPowered = $derived(S.poweredFrames.indexOf(uuid) !== -1);
  // const hasStartedDragging = $derived(S.dragState )

  const boxStyle = $derived(S.ui.boxStyle(box));
  let transformOriginStyle = $state("");

  $effect(() => {
    if (A.type === "movingFrames") {
      transformOriginStyle = `transform-origin: ${A.pickX * 100}% ${A.pickY * 100}%`;
    }
  });

  let wasExpanded = $state<boolean>(false);

  const asset = $derived(frame.assetUrl ? assets.V(frame.assetUrl) : null);

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

<div
  use:c={[
    "absolute top-0 left-0 will-change-transform",
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
    style={(isExpanded ? "" : S.ui.boxBorderRadius) + transformOriginStyle}
    use:c={[
      "size-full flex flex-col",
      "duration-150 transition-transform outline-solid outline-1 outline-black/10",
      {
        "scale-50 opacity-30": isTrashing,
        // "scale-102 opacity-100": isMoving && !isTrashing,
        "b-4 b-gray-300 bg-gray-300": !isPowered && !isSelected,
        "b-4 b-yellow-500 bg-yellow-300": isPowered && !isExpanded,
        "b-4 b-[hsl(215,_70%,_57%)] bg-[hsl(215,_70%,_57%)]":
          isSelected && !isExpanded,
        "b-0!": isExpanded,
        "cursor-default": !isMoving,
        "cursor-grabbing": isMoving,
      },
    ]}
    role="button"
    tabindex="-1"
    onmousedown={S.ev.mousedown("frame", uuid, "drag-handle")}
  >
    <div
      class="flex flex-grow flex-col shadow-[0_0_2px_#0002] rounded-[0.250rem]"
    >
      {#if !isExpanded}
        <div
          class="w-full flex b-b b-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 rounded-t-[0.250rem] px1 cursor-move shadow-[inset_0px_1px_0px_0px_#fff2]"
          style="height: {S.grid.size - 4}px;"
        >
          <div class="flex-grow">{JSON.stringify(frame.box)}</div>
          <button onmousedown={() => S.cmd("frame", uuid, "expand")}>
            <ExpandIcon />
          </button>
        </div>
      {/if}
      <div
        class="flex-grow bg-white rounded-b-[0.250rem] relative overflow-hidden"
      >
        {#if frame.assetUrl && asset}
          {#if isPowered}
            <!-- <FrameEmbed {asset} /> -->
          {:else}
            <FrameAssetInfo {asset} />
          {/if}
        {:else if S.storeConfig.depth === 0}
          <div
            class="w-full h-full transform-origin-tl"
            style={!isExpanded
              ? `transform: scale(${1 / S.pos.z}); width: ${
                  100 * S.pos.z
                }%; height: ${100 * S.pos.z}%;`
              : ""}
          >
            <Substrate
              parentPos={isExpanded ? { x: 0, y: 0, z: 1 } : S.pos}
              depth={S.storeConfig.depth + 1}
            />
          </div>
        {:else}
          Too deep
        {/if}
      </div>
    </div>

    <!-- <FrameContent {frame} {uuid} powered={isPowered} /> -->
  </div>
</div>

{#if validBox}
  <GridBox box={validBox} cx={"bg-sky-500/10 b-sky-500/60"} />
{/if}

{#if !isMoving && !isExpanded}
  <FrameInteracting {frame} {uuid} {boxStyle} />
{/if}
