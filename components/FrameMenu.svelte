<script lang="ts">
  // import LinkIcon from "~icons/fa6-solid/link";
  import ClipboardIcon from "~icons/fa6-solid/clipboard";
  import CircleMinusIcon from "~icons/fa6-solid/circle-minus";
  import LinkIcon from "~icons/fa6-solid/link";
  import MoveIcon from "~icons/fa6-solid/arrows-up-down-left-right";
  import assets from "../lib/stores/assets.svelte";
  import { type BoxedFrame } from "../lib/Frame";
  import SS from "../lib/stores/main.svelte";
  const S = SS.store;

  const { uuid, frame }: { uuid: string; frame: BoxedFrame } = $props();
</script>

{#if frame.assetUrl}
  {@const asset = assets.V(frame.assetUrl)}
  {#if asset}
    <div class="flexcs text-white relative">
      <button
        class="h-10 w-10 px2 relative z-20 flexcc text-black/60 bg-white rounded-full hover:text-red-500"
        onclick={(ev) => S.ev.mousedown(ev, ["remove-asset", uuid])}
      >
        <CircleMinusIcon />
      </button>
      <!-- <div
                class="absolute top-1/2 -translate-y-1/2 left-10 z-10 bg-black/20 b b-black/10 flexcs -ml2 rounded-r-md"
              >
                <div class="w6 h6 p1 ml2">
                  <img
                    alt="Asset icon"
                    src={asset.info.icon_src}
                    class="w-full w-full pointer-events-none"
                  />
                </div>
                <span class="text-sm mr1">{asset.info.name}</span>
              </div> -->
    </div>
  {:else}
    <div></div>
    <!-- Loading... -->
  {/if}
{:else}
  <button
    class="h-10 w-10 px2 relative z-20 flexcc text-black/60 bg-white rounded-full hover:text-cyan-500"
    onclick={(ev) => S.ev.click(ev, ["pick-asset", uuid])}
  >
    <LinkIcon />
  </button>
{/if}
<button
  class="h-10 w-10 px2 flexcc text-black/60 bg-white cursor-move rounded-full"
  onmousedown={(ev) => S.ev.mousedown(ev, ["frame-picker", uuid])}
>
  <MoveIcon class="size-full" />
</button>
<button
  class="h-10 w-10 px3 flexcc text-black/60 bg-white hover:text-cyan-500 rounded-full"
  aria-label="Copy link to iframe"
  onmousedown={(ev) => S.ev.mousedown(ev, ["copy-link", uuid])}
>
  <ClipboardIcon class="size-full" />
</button>
