<script lang="ts">
  import CircleIcon from "~icons/fa6-regular/circle";
  import SquareIcon from "~icons/fa6-regular/square";
  import ExpandIcon from "~icons/fa6-solid/expand";
  import CompressIcon from "~icons/fa6-solid/compress";

  import { portal } from "svelte-portal";

  import clients from "@center/clients";
  import { tooltip, c, type IconProp, cx } from "@center/snippets";
  import SS from "@stores/main.svelte";

  const { depth }: { depth: number } = $props();

  const S = SS.store;
</script>

{#snippet cornerButton(
  Content: IconProp | string,
  tooltipText: string,
  action: (ev: MouseEvent) => void
)}
  <button
    class="px2 py1 bg-white rounded-md text-xs hover:bg-gray-100 b b-black/10 shadow-md hover:scale-105"
    onclick={action}
    use:tooltip={tooltipText}
  >
    {#if typeof Content === "string"}
      {Content}
    {:else}
      <Content class="size-full" />
    {/if}
  </button>
{/snippet}

<div
  class={cx("absolute top-2  z-hud-zoom flex space-x-2", {
    "left-2": !S.expandedFrame,
    "right-2": S.expandedFrame,
  })}
>
  {#if !S.expandedFrame}
    {#if S.pos.z !== 1}
      {@render cornerButton(`${Math.round(S.pos.z * 100)}%`, "Reset zoom", () =>
        S.cmd("reset-zoom")
      )}
    {/if}
    {#if Object.keys(S.frames).length}
      {@render cornerButton(SquareIcon, "Fit all frames on the viewport", () =>
        S.cmd("fit-all")
      )}
    {/if}
    {@render cornerButton(CircleIcon, "Center the viewport", () =>
      S.cmd("center")
    )}
  {/if}
  {#if !clients.weave}
    {@render cornerButton(
      S.isInFullscreen ? CompressIcon : ExpandIcon,
      "Enter fullscreen mode",
      () => S.cmd("toggle-fullscreen")
    )}
  {/if}
</div>

{#if S.expandedFrame}
  <button
    style="z-index: {81 + depth};"
    class="px2 py1 fixed top-2 right-2 bg-white rounded-md text-xs hover:bg-gray-100 b b-black/10 shadow-md hover:scale-105"
    onclick={() => S.cmd("exit-expanded-frame")}
    use:portal={"body"}
    use:tooltip={"Exit expanded frame"}
  >
    <CompressIcon class="size-full" />
  </button>
{/if}
