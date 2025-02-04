<script lang="ts">
  import cx from "classnames";
  import TrashIcon from "~icons/fa6-solid/trash";
  import CheckIcon from "~icons/fa6-solid/check";
  import LinkIcon from "~icons/fa6-solid/link";
  import CircleMinusIcon from "~icons/fa6-solid/circle-minus";
  import MoveIcon from "~icons/fa6-solid/arrows-up-down-left-right";
  import { encodeHashToBase64 } from "@holochain/client";
  import SS, { type BoxResizeHandles } from "../lib/stores/main.svelte";
  import assets from "../lib/stores/assets.svelte";
  import profiles from "../lib/stores/profiles.svelte";
  import { type BoxedFrame, type Box } from "../lib/Frame";
  import ResizeHandle from "./ResizeHandle.svelte";
  import clients from "../lib/clients";
  import { hashEq } from "../lib/utils";
  // import Coral from "./Coral.svelte";
  // import GenericDnaSandbox from "./GenericDnaSandbox.svelte";

  const S = SS.store;
  S.mountInit();

  function boxSizeIsEnough(box: Box) {
    return box.w * box.h >= 4;
  }

  function resolveFrameBox(uuid: string, frame: BoxedFrame): Box {
    if (S.currentAction.type === "moveFrame") {
      if (uuid === S.currentAction.uuid) {
        return S.boxInPx({
          ...frame.box,
          x: frame.box.x + S.currentAction.boxDelta.x,
          y: frame.box.y + S.currentAction.boxDelta.y,
        });
      }
    } else if (S.currentAction.type === "resizeFrame") {
      if (uuid === S.currentAction.uuid) {
        return S.boxInPx(S.currentAction.newBox);
      }
    }

    return S.boxInPx(frame.box);
  }
</script>

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->

<!-- PROFILES -->

<div class="absolute top-0 right-0 bg-blue-500 rounded-bl-md">
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

{#if S.pos.z !== 1}
  <button
    class="absolute bottom-2 right-2 px2 py1 bg-white rounded-md text-xs z-100"
    onclick={S.ev.resetZoom}
  >
    {Math.round(S.pos.z * 100)}%
  </button>
{/if}

<!-- ZOOMABLE PANABLE CANVAS -->

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
  <!-- <div class="bg-red-500 absolute z-110 left-1/2 top-1/2 w-full h-full">
    <div
      class="w-full h-full bg-yellow-500/50 absolute -left-1/2 -top-1/2"
    ></div>
    <div class="bg-black/50 w-10 h-10 top-0 left-0 absolute"></div>
  </div> -->
  <!-- <Coral /> -->

  <!-- GRID PATTERN -->
  <canvas
    onmousedown={S.ev.mousedown}
    class="h-full w-full absolute top-0 left-0 z-10"
    bind:this={S.ref.grid}
  ></canvas>

  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <!-- <div class="h-full w-full absolute left-1/2 top-1/2"> -->
  <div
    class={cx("absolute top-0 left-0 z-40")}
    style={`transform: translateX(${S.pos.zx + S.pos.zw / 2}px) translateY(${S.pos.zy + S.pos.zh / 2}px) scale(${S.pos.z})`}
  >
    <!-- THE LITTLE SQUARE CURSOR -->
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
      <!-- THE FRAME SHOWN WHILE DRAGGING FOR CREATION -->
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

    <!-- ALL THE CREATED FRAMES -->
    {#each Object.entries(S.frames) as [uuid, frameWrapper] (uuid)}
      {@const frame = frameWrapper.value}
      {@const box = resolveFrameBox(uuid, frame)}
      {@const trashing =
        S.currentAction.type === "moveFrame" &&
        S.currentAction.uuid === uuid &&
        S.currentAction.trashing}
      {@const resizeHandler = (ev: MouseEvent, p: BoxResizeHandles) =>
        S.ev.mousedown(ev, ["frame-resize", p, uuid])}
      <!-- Shadow only element z-30 => So shadows don't overlap over other frames -->
      <div
        class={cx(
          "absolute top-0 left-0 z-30 rounded-md transition-opacity transition-duration-0 shadow-[0px_0px_2px_3px_#0003]",
          {
            "opacity-0 transition-delay-0": trashing,
            "opacity-100 transition-delay-150": !trashing,
          }
        )}
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
      ></div>
      <!-- Solid frame element z-40 -->
      <div
        class="absolute top-0 left-0 z-40"
        style={`
          width: ${box.w}px;
          height: ${box.h}px;
          transform: translateX(${box.x}px) translateY(${box.y}px);
        `}
      >
        <div
          style={`transform-origin: ${S.currentAction.type === "moveFrame" ? `${S.currentAction.pickX * 100}% ${S.currentAction.pickY * 100}%` : "50% 50%"}`}
          class={cx(
            "transition-transform  duration-150 bg-gray-100 b-gray-300 w-full h-full rounded-md shadow-[inset_0px_0px_1px_0px_#0003]",
            { "scale-50 opacity-70": trashing }
          )}
        >
          {#if frame.assetUrl}
            {@const asset = assets.V(frame.assetUrl)}

            {#if asset}
              {@const isSubstrateAsset = hashEq(
                asset.wal.hrl[0],
                clients.dnaHash
              )}
              {#if isSubstrateAsset && clients.wal}
                Substrate embed; preventing recursion
              {:else}
                <iframe
                  title="Asset"
                  class={cx(
                    "absolute top-0 z-30 left-0 h-full w-full rounded-md",
                    {
                      "pointer-events-none": S.currentAction.type !== "none",
                    }
                  )}
                  src={asset.iframeSrc}
                ></iframe>
              {/if}
            {:else}
              Loading...
            {/if}
          {:else}
            <div class="p4">
              <div>
                <input
                  class="bg-white text-black/80 rounded-md b b-black/10 px2 py1 w-full"
                  type="text"
                  onclick={(ev) => S.ev.click(ev, ["pick-asset", uuid])}
                  placeholder="Search, or enter URL"
                />
                <!-- <button class="bg-green-500 text-white rounded-full p2"
                  ><CheckIcon /></button
                > -->
              </div>
            </div>
          {/if}

          <!-- FRAME HANDLING TOOLS -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            aria-label="Pick frame up"
            onmousedown={(ev) => S.ev.mousedown(ev, ["frame-picker", uuid])}
            class="absolute z-40 left-1/2 bottom-full -translate-x-1/2 text-black/80 bg-gray-200 rounded-t-md cursor-move whitespace-nowrap b b-black/10"
            style={`height: ${S.gridSize}px; min-width: ${S.gridSize}px`}
          >
            <div class="flex h-full">
              {#if frame.assetUrl}
                {@const asset = assets.V(frame.assetUrl)}
                {#if asset}
                  <div class="flexcc px1">
                    <button
                      class="h-full px1 flexcc text-black/60 hover:text-red-500"
                      onclick={(ev) =>
                        S.ev.mousedown(ev, ["remove-asset", uuid])}
                    >
                      <CircleMinusIcon />
                    </button>
                    <div class="w6 h6 p1 mr1">
                      <img
                        alt="Asset icon"
                        src={asset.info.icon_src}
                        class="w-full w-full pointer-events-none"
                      />
                    </div>
                    <span class="text-sm mr1">{asset.info.name}</span>
                  </div>
                {:else}
                  Loading...
                {/if}
              {:else}
                <button class="h-full px1 flexcc text-black/60 cursor-move!">
                  <MoveIcon />
                </button>
              {/if}

              <button
                class="h-full px1 flexcc text-black/60 hover:text-cyan-500"
                aria-label="Copy link to iframe"
                onmousedown={(ev) => S.ev.mousedown(ev, ["copy-link", uuid])}
              >
                <LinkIcon />
              </button>
            </div>
          </div>

          <ResizeHandle pos="t" onMouseDown={resizeHandler} />
          <ResizeHandle pos="tr" onMouseDown={resizeHandler} />
          <ResizeHandle pos="r" onMouseDown={resizeHandler} />
          <ResizeHandle pos="br" onMouseDown={resizeHandler} />
          <ResizeHandle pos="b" onMouseDown={resizeHandler} />
          <ResizeHandle pos="bl" onMouseDown={resizeHandler} />
          <ResizeHandle pos="l" onMouseDown={resizeHandler} />
          <ResizeHandle pos="tl" onMouseDown={resizeHandler} />
        </div>
      </div>
    {/each}
  </div>
  <!-- </div> -->
</div>
