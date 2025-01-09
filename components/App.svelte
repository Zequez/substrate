<script lang="ts">
  import cx from "classnames";
  import { WeaveClient } from "@theweave/api";

  let { weaveClient }: { weaveClient?: WeaveClient } = $props();
  import S from "../lib/state.svelte";

  S.init();
</script>

<div
  onmousedown={S.ev.mousedown}
  onmouseup={S.ev.mouseup}
  onmousemove={S.ev.mousemove}
  onwheel={S.ev.wheel}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {})}
>
  <canvas
    class={cx("h-full w-full absolute top-0 left-0 z-10", {
      "cursor-grabbing": S.isPanning,
    })}
    bind:this={S.ref.grid}
  ></canvas>

  <div
    class="absolute top-0 left-0 z-20"
    style={`transform: translateX(${S.pos.zx}px) translateY(${S.pos.zy}px) scale(${S.pos.z})`}
  >
    {#if S.ghostFrame}
      {@const box = S.boxInPx(S.ghostFrame.box)}

      <div
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
        class={cx("z-30  b-2  absolute top-0 left-0 rounded-md", {
          "bg-sky-500/10 b-sky-500/60": !S.ghostFrameIsValid,
          "bg-sky-500/50 b-sky-500/100": S.ghostFrameIsValid,
        })}
      ></div>
    {/if}
    {#each S.frames as frame, i}
      {@const box = S.boxInPx(frame.box)}
      <div
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
        class="z-40 bg-gray-100 b-gray-300 absolute top-0 left-0 rounded-md shadow-md"
      >
        {frame.assetUrl}
        <div
          data-frame-picker={i}
          class="absolute left-1/2 bottom-full -translate-x-1/2 bg-black/70 rounded-t-md cursor-move"
          style={`height: ${S.zGridSize}px; width: ${S.zGridSize}px`}
        ></div>
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
