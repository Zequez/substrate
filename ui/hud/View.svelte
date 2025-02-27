<script lang="ts">
  import SquareIcon from "~icons/fa6-regular/square";
  import ExpandIcon from "~icons/fa6-solid/expand";
  import CompressIcon from "~icons/fa6-solid/compress";

  import clients from "@center/clients";
  import { tooltip, c, type IconProp } from "@center/snippets";
  import SS from "@stores/main.svelte";

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

<div class="absolute top-2 left-2 z-hud-zoom flex space-x-2">
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
  {/if}
  {#if !clients.weave}
    {@render cornerButton(
      S.isInFullscreen ? CompressIcon : ExpandIcon,
      "Enter fullscreen mode",
      () => S.cmd("toggle-fullscreen")
    )}
  {/if}

  {#if S.expandedFrame}
    {@render cornerButton(CompressIcon, "Exit expanded frame", () =>
      S.cmd("exit-expanded-frame")
    )}
  {/if}
</div>
