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
  }: { uuid: string; boxStyle: string; frame: BoxedFrame } = $props();

  const S = SS.store;
</script>

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
  {#if S.pos.z > 0.2 && !S.currentActionIs("moveFrame", "selecting", "resizeFrame")}
    <div
      class="absolute top-0 left-0 z-frame-resize-handles pointer-events-none"
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
