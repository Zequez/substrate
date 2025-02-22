<script lang="ts">
  // import LinkIcon from "~icons/fa6-solid/link";
  import ClipboardIcon from "~icons/fa6-solid/clipboard";
  import CircleMinusIcon from "~icons/fa6-solid/circle-minus";
  import LinkIcon from "~icons/fa6-solid/link";
  import MoveIcon from "~icons/fa6-solid/arrows-up-down-left-right";
  import { type BoxedFrame } from "@center/Frame";
  import assets from "@stores/assets.svelte";
  import SS from "@stores/main.svelte";
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
  class="h-10 w-10 px3 flexcc text-black/60 bg-white hover:text-cyan-500 rounded-full"
  aria-label="Copy link to iframe"
  onmousedown={(ev) => S.ev.mousedown(ev, ["copy-link", uuid])}
>
  <ClipboardIcon class="size-full" />
</button>
