<script lang="ts">
  import { fly } from "svelte/transition";
  import { linear } from "svelte/easing";
  import { c } from "../lib/utils";
  import SS, { type BoxResizeHandles } from "../lib/stores/main.svelte";
  import { type BoxedFrame } from "../lib/Frame";
  import ResizeHandle from "./ResizeHandle.svelte";
  import FrameMenu from "./FrameMenu.svelte";
  const {
    uuid,
    boxStyle,
    frame,
  }: { uuid: string; boxStyle: string; frame: BoxedFrame } = $props();

  const S = SS.store;

  // let el = $state<HTMLDivElement>();

  // type Side = "t" | "r" | "l" | "b";

  // let side = $state<"t" | "r" | "l" | "b" | null>(null);
  // const sideStyles = {
  //   t: "left-1/2 bottom-1/1 -translate-x-1/2 ",
  //   r: "top-1/2 left-1/1 -translate-y-1/2  ",
  //   b: "left-1/2 top-1/1 -translate-x-1/2 ",
  //   l: "top-1/2 right-1/1 -translate-y-1/2 ",
  // };

  // const sideStylesInner = {
  //   t: "space-x-2 transform-origin-bottom rounded-t-md",
  //   r: "flex-col  space-y-2 transform-origin-left rounded-r-md",
  //   b: "space-x-2 transform-origin-top rounded-b-md",
  //   l: "flex-col  space-y-2 transform-origin-right rounded-l-md",
  // };

  // const flyConfigs = {
  //   t: { y: 100 },
  //   r: { x: -100 },
  //   b: { y: -100 },
  //   l: { x: 100 },
  // };

  // function handleMouseMove(ev: MouseEvent) {
  //   if (el) {
  //     const rect = el.getBoundingClientRect();
  //     side = closestDiagonalSide(ev, rect);
  //   }
  // }

  // function isTooFar(event: MouseEvent, rect: DOMRect) {
  //   const { clientX: x, clientY: y } = event;
  //   const distance = 150;
  //   return (
  //     x < rect.left - distance ||
  //     x > rect.right + distance ||
  //     y < rect.top - distance ||
  //     y > rect.bottom + distance
  //   );
  // }

  // function closestDiagonalSide(event: MouseEvent, rect: DOMRect): Side | null {
  //   const { clientX: x, clientY: y } = event;
  //   if (isTooFar(event, rect)) return null;

  //   // Compute center of the rectangle
  //   const centerX = (rect.left + rect.right) / 2;
  //   const centerY = (rect.top + rect.bottom) / 2;

  //   // Compute width and height
  //   const width = rect.right - rect.left;
  //   const height = rect.bottom - rect.top;

  //   // Compute the diagonal angle
  //   const alpha = Math.atan2(height, width); // Angle of the diagonal

  //   // Compute the angle from center to mouse
  //   const theta = Math.atan2(y - centerY, x - centerX); // -π to π

  //   // Classify based on angular region
  //   if (-alpha < theta && theta < alpha) return "r"; // Right
  //   if (alpha < theta && theta < Math.PI - alpha) return "b"; // Bottom
  //   if (Math.PI - alpha < theta || theta < -(Math.PI - alpha)) return "l"; // Left
  //   return "t"; // Top
  // }

  // $effect(() => {
  //   if (S.lastInteractionUuid === uuid) {
  //     window.addEventListener("mousemove", handleMouseMove);
  //   } else {
  //     window.removeEventListener("mousemove", handleMouseMove);
  //   }
  // });
</script>

<!-- {#snippet sideControls(thisSide: Side)}
  {#if thisSide === side}
    {@const sideStyle = sideStyles[thisSide]}
    {@const sideStyleInner = sideStylesInner[thisSide]}
    {@const flyConfig = flyConfigs[thisSide]}

    <div
      class="{sideStyle} absolute"
      transition:fly={{ ...flyConfig, easing: linear }}
    >
      <div
        class="flex {sideStyleInner} pointer-events-auto bg-black/10 p2"
        style="transform: scale({(1 / S.pos.z) * 0.8});"
      >
        <FrameMenu {uuid} {frame} />
      </div>
    </div>
  {/if}
{/snippet} -->

<!-- Entering area detector -->
<div
  role="presentation"
  onmouseover={(ev) => S.ev.mouseover(ev, uuid)}
  onfocus={() => {}}
  style={boxStyle}
  use:c={[
    "z-60 absolute top-0 left-0",
    {
      hidden: S.lastInteractionUuid === uuid,
    },
  ]}
></div>

<!-- FLOATING INFO/CONTROLS -->
{#if S.lastInteractionUuid === uuid && !S.currentActionIs("resizeFrame", "pan")}
  {@const resizeHandler = (ev: MouseEvent, handle: BoxResizeHandles) =>
    S.ev.mousedown(ev, ["frame-resize", handle, uuid])}
  <!-- {#if S.pos.z > 0.5}
    <div
      bind:this={el}
      class="absolute top-0 left-0 pointer-events-none z-70"
      style={boxStyle}
    >
      {@render sideControls("t")}
      {@render sideControls("r")}
      {@render sideControls("b")}
      {@render sideControls("l")}
    </div>
  {/if} -->
  {#if S.pos.z > 0.2 && !S.currentActionIs("moveFrame", "createFrame", "resizeFrame")}
    <div
      class="absolute top-0 left-0 z-90 pointer-events-none"
      style={boxStyle}
    >
      <ResizeHandle pos="t" onMouseDown={resizeHandler} />
      <ResizeHandle pos="tr" onMouseDown={resizeHandler} />
      <ResizeHandle pos="r" onMouseDown={resizeHandler} />
      <ResizeHandle pos="br" onMouseDown={resizeHandler} />
      <ResizeHandle pos="b" onMouseDown={resizeHandler} />
      <ResizeHandle pos="bl" onMouseDown={resizeHandler} />
      <ResizeHandle pos="l" onMouseDown={resizeHandler} />
      <ResizeHandle pos="tl" onMouseDown={resizeHandler} />
    </div>
  {/if}
{/if}
