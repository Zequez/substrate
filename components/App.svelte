<script lang="ts">
  import cx from "classnames";
  import { WeaveClient } from "@theweave/api";

  let { weaveClient }: { weaveClient?: WeaveClient } = $props();
  import S from "../lib/state.svelte";
  import { type Box } from "../lib/Frame";

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
        <button
          aria-label="Resize frame right"
          class="absolute -right-1 top-2 bottom-2 bg-red-500 w2 cursor-ew-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "r", i])}
        >
        </button>
        <!-- Left handle -->
        <button
          aria-label="Resize frame left"
          class="absolute -left-1 top-2 bottom-2 bg-red-500 w2 cursor-ew-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "l", i])}
        >
        </button>
        <!-- Top handle -->
        <button
          aria-label="Resize frame top"
          class="absolute -top-1 left-2 right-2 bg-red-500 h2 cursor-ns-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "t", i])}
        >
        </button>
        <!-- Bottom handle -->
        <button
          aria-label="Resize frame bottom"
          class="absolute -bottom-1 left-2 right-2 bg-red-500 h2 cursor-ns-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "b", i])}
        >
        </button>
        <!-- TR handle -->
        <button
          aria-label="Resize frame top right"
          class="absolute -top-1 -right-1 bg-orange-500 h4 w4 cursor-nesw-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "tr", i])}
        >
        </button>
        <!-- BL handle -->
        <button
          aria-label="Resize frame bottom left"
          class="absolute -bottom-1 -left-1 bg-orange-500 h4 w4 cursor-nesw-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "bl", i])}
        >
        </button>
        <!-- TL handle -->
        <button
          aria-label="Resize frame top left"
          class="absolute -top-1 -left-1 bg-orange-500 h4 w4 cursor-nwse-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "tl", i])}
        >
        </button>
        <!-- BR handle -->
        <button
          aria-label="Resize frame bottom right"
          class="absolute -bottom-1 -right-1 bg-orange-500 h4 w4 cursor-nwse-resize"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-resize", "br", i])}
        >
        </button>
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
