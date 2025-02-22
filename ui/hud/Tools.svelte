<script lang="ts">
  import HandToolClosedIcon from "~icons/fa6-solid/hand-back-fist";
  import HandToolIcon from "~icons/fa6-solid/hand";
  import SelectToolIcon from "~icons/fa6-solid/arrow-pointer";
  import FrameToolIcon from "~icons/fa6-solid/window-maximize";
  import ArtToolIcon from "~icons/fa6-solid/brush";
  import FavIcon from "~icons/fa6-solid/star";
  import LightningToolIcon from "~icons/fa6-solid/bolt";
  import { tooltip, c, type IconProp } from "@center/snippets";
  import SS, {
    WHEEL_BUTTON,
    ALT_BUTTON,
    MAIN_BUTTON,
    type ToolType,
  } from "@stores/main.svelte";

  const S = SS.store;
</script>

<div
  class="z-hud p1 flex space-x-1 absolute top-2 left-1/2 -translate-x-1/2 h-10 rounded-md b b-black/10 shadow-md bg-gray-100"
>
  {#snippet toolButton(
    Icon: IconProp,
    tooltipText: string,
    hotkey: string | null,
    tool: ToolType
  )}
    <button
      use:tooltip={`${tooltipText} tool ${hotkey ? `— ${hotkey}` : ""}`}
      use:c={[
        "w-8 h-full flexcc rounded-md p2 relative text-black/70 b",
        {
          "bg-green-200 b-black/10": S.tool.main === tool,
          "bg-gray-200 b-black/0": S.tool.main !== tool,
        },
      ]}
      oncontextmenu={(ev) => (
        ev.preventDefault(), S.ev.click(ev, ["set-tool-alt", tool])
      )}
      onclick={(ev) =>
        ev.button === MAIN_BUTTON
          ? S.ev.click(ev, ["set-tool", tool])
          : ev.button === ALT_BUTTON
            ? S.ev.click(ev, ["set-tool-alt", tool])
            : null}
    >
      <Icon class="size-full" />
      {#if hotkey}
        <span class="absolute bottom-0 right-.5 text-[0.5rem]">{hotkey}</span>
      {/if}
      {#if S.tool.alt === tool}
        <span class="absolute bottom-.7 left-.5 text-[0.32rem]"
          ><FavIcon /></span
        >
      {/if}
    </button>
  {/snippet}

  {@render toolButton(
    S.currentAction.type === "pan" ? HandToolClosedIcon : HandToolIcon,
    "Hand",
    null,
    "hand"
  )}
  {@render toolButton(SelectToolIcon, "Selection", "1", "select")}
  {@render toolButton(FrameToolIcon, "Linked Frame", "2", "frame")}
  {@render toolButton(ArtToolIcon, "Art", "3", "art")}
  {@render toolButton(LightningToolIcon, "Lightning", "4", "lightning")}
</div>
