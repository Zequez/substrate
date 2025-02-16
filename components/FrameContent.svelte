<script lang="ts">
  import { type Component } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";
  import MoveIcon from "~icons/fa6-solid/arrows-up-down-left-right";
  import ClipboardIcon from "~icons/fa6-solid/clipboard";
  import CircleMinusIcon from "~icons/fa6-solid/circle-minus";
  import ExpandIcon from "~icons/fa6-solid/expand";
  import LinkIcon from "~icons/fa6-solid/link";
  import cx from "classnames";
  import { type BoxedFrame } from "../lib/Frame";
  import assets from "../lib/stores/assets.svelte";
  import clients from "../lib/clients";
  import { hashEq } from "../lib/utils";
  import SS from "../lib/stores/main.svelte";
  import { tooltip } from "../lib/tooltip";

  let { uuid, frame }: { uuid: string; frame: BoxedFrame } = $props();
  const S = SS.store;

  const asset = $derived(frame.assetUrl ? assets.V(frame.assetUrl) : null);

  let loaded = $state(false);
  function handleLoadIframe() {
    loaded = true;
  }

  const controlMode = $derived(S.keyShift || S.pos.z <= 0.5);
  let frameEl = $state<HTMLIFrameElement | null>(null);
  let frameContainerEl = $state<HTMLDivElement | null>(null);
  let fullscreenEl = document.getElementById("fullscreen");

  $effect(() => {
    // console.log("FRAME ELEMENT?", frameEl);
    // if (!frameEl) return;
    // if (
    //   S.expandedFrame === uuid &&
    //   frameEl.parentElement === frameContainerEl
    // ) {
    //   fullscreenEl!.append(frameEl);
    // } else if (
    //   S.expandedFrame !== uuid &&
    //   frameEl.parentElement !== frameContainerEl
    // ) {
    //   frameContainerEl!.append(frameEl);
    // }
    // if (S.expandedFrame === uuid && frameEl) {
    //   fullscreenEl
    //   // const { left, top } = frameEl.getBoundingClientRect();
    //   // leftTop = [left, top];
    // }
  });
</script>

{#if frame.assetUrl}
  {#if asset}
    {@const isSubstrateAsset = hashEq(asset.wal.hrl[0], clients.dnaHash)}
    {#if isSubstrateAsset && clients.wal}
      Substrate embed; preventing recursion
    {:else if !controlMode || loaded}
      <iframe
        title="Asset"
        bind:this={frameEl}
        class={cx("absolute top-0 z-30 left-0 h-full w-full rounded-md", {
          "pointer-events-none": S.currentAction.type !== "none",
          hidden: controlMode && S.expandedFrame !== uuid,
        })}
        src={asset.iframeSrc}
        onload={handleLoadIframe}
      ></iframe>
    {/if}

    {#if controlMode && S.expandedFrame !== uuid}
      <div
        class="absolute overflow-hidden p-[10%] top-0 z-30 left-0 h-full size-full flexcc opacity-75"
      >
        <div class="flexcc flex-wrap">
          <img
            src={asset.info.icon_src}
            alt={asset.info.name}
            style={`width: ${2 / S.pos.z}rem; height: ${2 / S.pos.z}rem`}
          />
          <div
            class="text-center"
            style={`font-size: ${1 / S.pos.z}rem; margin: 0 ${0.25 / S.pos.z}rem`}
          >
            {asset.info.name}
          </div>
        </div>
      </div>
    {/if}
  {:else}
    Loading...
  {/if}
{:else if !controlMode}
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

{#if controlMode && S.expandedFrame !== uuid}
  {@const size = (1 * 1) / S.pos.z}
  {@const asset = frame.assetUrl ? assets.V(frame.assetUrl) : null}

  {#snippet menuButton(
    Icon: Component<SvelteHTMLElements["svg"]>,
    tooltipText: string,
    onClick: (ev: MouseEvent) => void,
    klass: string
  )}
    <button
      style={`width: ${size}rem; margin-left: ${size / 10}rem`}
      use:tooltip={tooltipText}
      class="h-full p-[8%] bg-black/80 hover:bg-black/100 rounded-full flexcc relative z-20 flexcc text-white/80 {klass}"
      onclick={onClick}
    >
      <Icon class="size-full" />
    </button>
  {/snippet}

  <div
    style={`${S.ui.boxBorderRadius}; height: ${size}rem; top: ${size / 10}rem; right: ${size / 10}rem;`}
    class="absolute z-110 flexcc"
  >
    {#if frame.assetUrl}
      {@render menuButton(
        CircleMinusIcon,
        "Unlink asset",
        (ev) => S.ev.mousedown(ev, ["remove-asset", uuid]),
        "hover:text-red-500"
      )}
    {:else}
      {@render menuButton(
        LinkIcon,
        "Pick asset",
        (ev) => S.ev.click(ev, ["pick-asset", uuid]),
        "hover:text-cyan-500"
      )}
    {/if}
    {@render menuButton(
      ClipboardIcon,
      "Copy link & add to pocket",
      (ev) => S.ev.mousedown(ev, ["copy-link", uuid]),
      "hover:text-cyan-500"
    )}
    {@render menuButton(
      ExpandIcon,
      "Expand",
      (ev) => S.ev.mousedown(ev, ["expand-frame", uuid]),
      "hover:text-cyan-500"
    )}

    <!-- <FrameMenu uuid={p.uuid} frame={frame} /> -->
  </div>
  <button
    class="size-full p-[10%] z-100 absolute top-0 left-0 cursor-move flexcc text-black/25"
    onmousedown={(ev) => S.ev.mousedown(ev, ["frame-picker", [uuid]])}
  >
    {#if !asset}
      <MoveIcon class="size-full max-w-full max-h-full" />
    {/if}
  </button>
{/if}
