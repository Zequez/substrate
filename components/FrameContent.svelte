<script lang="ts">
  import MoveIcon from "~icons/fa6-solid/arrows-up-down-left-right";
  import cx from "classnames";
  import { type BoxedFrame } from "../lib/Frame";
  import assets from "../lib/stores/assets.svelte";
  import clients from "../lib/clients";
  import { hashEq } from "../lib/utils";
  import SS from "../lib/stores/main.svelte";

  let p: { uuid: string; frame: BoxedFrame } = $props();
  const S = SS.store;

  const asset = $derived(p.frame.assetUrl ? assets.V(p.frame.assetUrl) : null);

  let loaded = $state(false);
  function handleLoadIframe() {
    loaded = true;
  }

  const minDimension = $derived(Math.min(p.frame.box.w, p.frame.box.h));
  const frameIconPadding = $derived(
    S.grid.size *
      S.pos.z *
      (minDimension <= 4 ? (minDimension <= 2 ? 1 : 2) : 4)
  );
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
      <div
        style={`padding: ${frameIconPadding}px`}
        class="absolute top-0 z-30 left-0 h-full size-full flexcc opacity-75"
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
{:else if S.pos.z > 0.5}
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

{#if S.pos.z <= 0.5}
  <button
    style={`padding: ${frameIconPadding}px`}
    class="size-full z-100 absolute top-0 left-0 cursor-move flexcc text-black/25"
    onmousedown={(ev) => S.ev.mousedown(ev, ["frame-picker", [p.uuid]])}
  >
    {#if !asset}
      <MoveIcon class="size-full max-w-full max-h-full" />
    {/if}
  </button>
{/if}
