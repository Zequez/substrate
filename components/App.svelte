<script lang="ts">
  import cx from "classnames";
  import { WeaveClient } from "@theweave/api";
  import { SimpleHolochain } from "generic-dna/lib/src";

  let {
    weaveClient,
    genericZomeClient,
  }: { weaveClient?: WeaveClient; genericZomeClient: SimpleHolochain } =
    $props();
  import S, { type BoxResizeHandles } from "../lib/state.svelte";
  import assets from "../lib/assets.svelte";
  import profiles from "../lib/profiles.svelte";
  import { type Box } from "../lib/Frame";
  import ResizeHandle from "./ResizeHandle.svelte";
  import framesBackend from "../lib/frames-store/frames.svelte";
  import Coral from "./Coral.svelte";
  // import GenericDnaSandbox from "./GenericDnaSandbox.svelte";

  S.init(weaveClient, genericZomeClient);
  // framesBackend.init(weaveClient);

  function boxSizeIsEnough(box: Box) {
    return box.w * box.h >= 4;
  }
</script>

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->

<div class="absolute top-0 right-0 bg-blue-500 rounded-bl-md">
  {#each Object.entries(profiles.participantsProfiles) as [agent, profile]}
    {#if profile === "unknown" || profile === "none"}
      {agent.slice(0, 5)}
    {:else}
      {profile.nickname}
    {/if}
  {/each}
</div>

<div
  onmouseup={S.ev.mouseup}
  onmousemove={S.ev.mousemove}
  onwheel={S.ev.wheel}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing":
      S.currentAction.type === "pan" || S.currentAction.type === "moveFrame",
  })}
>
  <!-- <Coral /> -->
  <canvas
    onmousedown={S.ev.mousedown}
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
          "z-30  b-2 absolute top-0 left-0 rounded-md bg-sky-500/10 b-sky-500/60 pointer-events-none"
        )}
      ></div>
    {:else if S.currentAction.type === "createFrame"}
      {@const boxValid = boxSizeIsEnough(S.currentAction.boxNormalized)}
      {@const box = S.boxInPx(S.currentAction.boxNormalized)}

      <div
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
        class={cx(
          "z-50  b-2  absolute top-0 left-0 rounded-md pointer-events-none",
          {
            "bg-sky-500/10 b-sky-500/60": !boxValid,
            "bg-sky-500/50 b-sky-500/100": boxValid,
          }
        )}
      ></div>
    {/if}
    {#each Object.entries(S.frames) as [uuid, frameWrapper] (uuid)}
      {@const frame = frameWrapper.value}
      {@const box =
        S.currentAction.type === "moveFrame" && uuid === S.currentAction.uuid
          ? S.boxInPx({
              ...frame.box,
              x: frame.box.x + S.currentAction.boxDelta.x,
              y: frame.box.y + S.currentAction.boxDelta.y,
            })
          : S.currentAction.type === "resizeFrame" &&
              uuid === S.currentAction.uuid
            ? S.boxInPx(S.currentAction.newBox)
            : S.boxInPx(frame.box)}
      {@const resizeHandler = (ev: MouseEvent, p: BoxResizeHandles) =>
        S.ev.mousedown(ev, ["frame-resize", p, uuid])}
      <div
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
        class="z-40 bg-gray-100 b-gray-300 absolute top-0 left-0 rounded-md shadow-md"
      >
        {#if frame.assetUrl}
          {@const asset = assets.V[frame.assetUrl]}
          {#if asset}
            <iframe
              title="Asset"
              class="absolute top-0 z-30 left-0 h-full w-full rounded-md"
              src={assets.V[frame.assetUrl]?.iframeSrc}
            ></iframe>
          {:else}
            Loading...
          {/if}
        {:else}
          <button
            class="h-full w-full z-30 absolute top-0 left-0 flexcc"
            onclick={(ev) => S.ev.click(ev, ["pick-asset", uuid])}
            >Select asset</button
          >
        {/if}

        <button
          aria-label="Pick frame up"
          onmousedown={(ev) => S.ev.mousedown(ev, ["frame-picker", uuid])}
          class="absolute left-1/2 bottom-full -translate-x-1/2 text-black/80 bg-gray-200 rounded-t-md cursor-move whitespace-nowrap b b-black/10"
          style={`height: ${S.gridSize}px; min-width: ${S.gridSize}px`}
        >
          {#if frame.assetUrl}
            {@const asset = assets.V[frame.assetUrl]}
            {#if asset}
              <div class="flexcc px1">
                <div class="w6 h6 p1 mr1">
                  <img
                    alt="Asset icon"
                    src={asset.info.icon_src}
                    class="w-full w-full pointer-events-none"
                  />
                </div>
                {console.log("ASSET INFO", asset.info.name)}
                <span class="text-sm mr1">{asset.info.name}</span>
                <!-- <div
                  class="bg-black/10 shadow-inner px1 text-xs text-black/40 text-mono rounded-md"
                >
                  kando.lrl/test
                </div> -->
              </div>
            {:else}
              Loading...
            {/if}
          {/if}
        </button>
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
