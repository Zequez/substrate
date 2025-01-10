<script lang="ts">
  import cx from "classnames";
  import { WeaveClient } from "@theweave/api";

  let { weaveClient }: { weaveClient?: WeaveClient } = $props();
  import S, { type BoxResizeHandles } from "../lib/state.svelte";
  import { type Box } from "../lib/Frame";
  import ResizeHandle from "./ResizeHandle.svelte";

  S.init();

  function boxSizeIsEnough(box: Box) {
    return box.w * box.h > 4;
  }
</script>

<div
  onmousedown={S.ev.mousedown}
  onmouseup={S.ev.mouseup}
  onmousemove={S.ev.mousemove}
  onwheel={S.ev.wheel}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing":
      S.currentAction.type === "pan" || S.currentAction.type === "moveFrame",
  })}
>
  <canvas
    class="h-full w-full absolute top-0 left-0 z-10"
    bind:this={S.ref.grid}
  ></canvas>

  <div
    class="absolute top-0 left-0 z-20"
    style={`transform: translateX(${S.pos.zx}px) translateY(${S.pos.zy}px) scale(${S.pos.z})`}
  >
    {#if S.currentAction.type === "none"}
      {@const box = S.boxInPx(S.mouseBox)}
      <div
        style={`

          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
        class={cx(
          "z-30  b-2 absolute top-0 left-0 rounded-md bg-sky-500/10 b-sky-500/60"
        )}
      ></div>
    {:else if S.currentAction.type === "createFrame"}
      {@const boxValid = boxSizeIsEnough(S.currentAction.box)}
      {@const box = S.boxInPx(S.currentAction.box)}

      <div
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
        class={cx("z-30  b-2  absolute top-0 left-0 rounded-md", {
          "bg-sky-500/10 b-sky-500/60": !boxValid,
          "bg-sky-500/50 b-sky-500/100": boxValid,
        })}
      ></div>
    {/if}
    {#each S.frames as frame, i (i)}
      {@const box =
        S.currentAction.type === "moveFrame" && i === S.currentAction.i
          ? S.boxInPx({
              ...frame.box,
              x: frame.box.x + S.currentAction.boxDelta.x,
              y: frame.box.y + S.currentAction.boxDelta.y,
            })
          : S.currentAction.type === "resizeFrame" && i === S.currentAction.i
            ? S.boxInPx(S.currentAction.newBox)
            : S.boxInPx(frame.box)}
      {@const resizeHandler = (ev: MouseEvent, p: BoxResizeHandles) =>
        S.ev.mousedown(ev, ["frame-resize", p, i])}
      <div
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
        class="z-40 bg-gray-100 b-gray-300 absolute top-0 left-0 rounded-md shadow-md"
      >
        {frame.assetUrl}

        <button
          aria-label="Pick frame up"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-picker", i])}
          class="absolute left-1/2 bottom-full -translate-x-1/2 bg-black/70 rounded-t-md cursor-move"
          style={`height: ${S.zGridSize}px; width: ${S.zGridSize}px`}
        ></button>
        <!-- Right handle -->

        <ResizeHandle pos="t" onMouseDown={resizeHandler} />
        <ResizeHandle pos="tr" onMouseDown={resizeHandler} />
        <ResizeHandle pos="r" onMouseDown={resizeHandler} />
        <ResizeHandle pos="br" onMouseDown={resizeHandler} />
        <ResizeHandle pos="b" onMouseDown={resizeHandler} />
        <ResizeHandle pos="bl" onMouseDown={resizeHandler} />
        <ResizeHandle pos="l" onMouseDown={resizeHandler} />
        <ResizeHandle pos="tl" onMouseDown={resizeHandler} />
      </div>
    {/each}
  </div>
</div>

{#if S.pos.z !== 1}
  <button
    class="absolute bottom-2 right-2 px2 py1 bg-white rounded-md text-xs z-100"
    onclick={S.ev.resetZoom}
  >
    {Math.round(S.pos.z * 100)}%
  </button>
{/if}
