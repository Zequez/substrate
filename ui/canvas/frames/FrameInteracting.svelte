<script lang="ts">
  import { c } from "@center/snippets";
  import { type BoxedFrame } from "@center/Frame";

  import SS, { type BoxResizeHandles } from "@stores/main.svelte";

  import ResizeHandle from "./hud/ResizeHandle.svelte";
  import FrameMenu from "./hud/FrameMenu.svelte";

  const {
    uuid,
    boxStyle,
  }: { uuid: string; boxStyle: string; frame: BoxedFrame } = $props();

  const S = SS.store;
</script>

<!-- Entering area detector -->
<div
  role="presentation"
  onmouseover={S.ev.mouseover("frame", uuid)}
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
{#if S.lastInteractionUuid === uuid && (S.dragState.type === "none" || S.dragState.type === "resizingFrame")}
  {@const resizeHandler = (ev: MouseEvent, handle: BoxResizeHandles) =>
    S.ev.mousedown("frame", uuid, "resize-handle", handle)(ev)}
  {#if S.pos.z > 0.2}
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
