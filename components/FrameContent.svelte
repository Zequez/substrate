<script lang="ts">
  import LinkIcon from "~icons/fa6-solid/link";
  import CircleMinusIcon from "~icons/fa6-solid/circle-minus";
  import MoveIcon from "~icons/fa6-solid/arrows-up-down-left-right";
  import cx from "classnames";
  import { type BoxedFrame } from "../lib/Frame";
  import assets from "../lib/stores/assets.svelte";
  import clients from "../lib/clients";
  import { hashEq } from "../lib/utils";
  import SS, { type BoxResizeHandles } from "../lib/stores/main.svelte";
  import ResizeHandle from "./ResizeHandle.svelte";

  let p: { uuid: string; frame: BoxedFrame } = $props();
  const S = SS.store;

  const asset = $derived(p.frame.assetUrl ? assets.V(p.frame.assetUrl) : null);

  let loaded = $state(false);
  function handleLoadIframe() {
    loaded = true;
  }

  const resizeHandler = (ev: MouseEvent, handle: BoxResizeHandles) =>
    S.ev.mousedown(ev, ["frame-resize", handle, p.uuid]);
</script>

{#if p.frame.assetUrl}
  {#if asset}
    {@const isSubstrateAsset = hashEq(asset.wal.hrl[0], clients.dnaHash)}
    {#if isSubstrateAsset && clients.wal}
      Substrate embed; preventing recursion
    {:else if S.pos.z > 0.5 || loaded}
      <iframe
        title="Asset"
        class={cx("absolute top-0 z-30 left-0 h-full w-full rounded-md", {
          "pointer-events-none": S.currentAction.type !== "none",
          hidden: S.pos.z <= 0.5,
        })}
        src={asset.iframeSrc}
        onload={handleLoadIframe}
      ></iframe>
    {/if}

    {#if S.pos.z <= 0.5}
      {@const padding = S.grid.size * S.pos.z * 4}
      <div
        style={`padding: ${padding}px`}
        class="absloute top-0 z-30 left-0 h-full rounded-md flexcc"
      >
        <img
          src={asset.info.icon_src}
          alt={asset.info.name}
          class="max-w-full max-h-full"
        />
      </div>
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
        onclick={(ev) => S.ev.click(ev, ["pick-asset", p.uuid])}
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
  onmousedown={(ev) => S.ev.mousedown(ev, ["frame-picker", p.uuid])}
  class="absolute z-40 left-1/2 bottom-full -translate-x-1/2 text-black/80 bg-gray-200 rounded-t-md cursor-move whitespace-nowrap b b-black/10"
  style={`height: ${S.grid.size}px; min-width: ${S.grid.size}px`}
>
  <div class="flex h-full">
    {#if p.frame.assetUrl}
      {@const asset = assets.V(p.frame.assetUrl)}
      {#if asset}
        <div class="flexcc px1">
          <button
            class="h-full px1 flexcc text-black/60 hover:text-red-500"
            onclick={(ev) => S.ev.mousedown(ev, ["remove-asset", p.uuid])}
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
      onmousedown={(ev) => S.ev.mousedown(ev, ["copy-link", p.uuid])}
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
