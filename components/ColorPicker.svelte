<script lang="ts">
  import PaintbrushIcon from "~icons/fa6-solid/paintbrush";
  import { PALLETTE } from "../lib/stores/AgentColorPixels.svelte";
  import SS from "../lib/stores/main.svelte";
  import { c } from "../lib/utils";

  const S = SS.store;

  // const pos = $derived(S.currentColor)
</script>

<div
  class="absolute bottom-2 left-2 z-120 transform-origin-bottom-left flex p1 bg-white rounded-md b-2 b-black/10 shadow-md"
>
  <PaintbrushIcon class="w-5 h-5 text-black/60" />
  {#each PALLETTE as color, i}
    <button
      aria-label="Pick color pallette"
      use:c={[
        "flexcc h-5 w-5 b b-black/10 relative z-20 ml2 rounded-full hover:scale-110",
        {
          "scale-110": i === S.currentColor,
        },
      ]}
      style={color ? `background-color: ${color};` : ""}
      onclick={(ev) => S.ev.click(ev, ["set-pallette", i])}
    >
      {#if !color}
        <span class="text-[27px] mb1.25 text-red-500 font-thin">&times;</span>
      {/if}
    </button>
  {/each}
  <div
    class="absolute opacity-50 z-10 transition-[left,background-color] b b-black/20 rounded-md top-0 h-7 w-7"
    style={`
      left: ${(S.currentColor + 1) * 1.75}rem;
      background-color: ${PALLETTE[S.currentColor]};
    `}
  ></div>
</div>
