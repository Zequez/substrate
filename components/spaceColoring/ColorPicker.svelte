<script lang="ts">
  import PaintbrushIcon from "~icons/fa6-solid/paintbrush";
  import { PALLETTE } from "../../lib/stores/spaceColoring.svelte";
  import { c } from "../../lib/utils";

  const {
    onPickMain,
    onPickAlt,
    mainColor,
    altColor,
  }: {
    onPickMain: (ev: MouseEvent, i: number) => void;
    mainColor: number;
    altColor: number;
    onPickAlt: (ev: MouseEvent, i: number) => void;
  } = $props();
</script>

<div
  class="absolute top-1/2 -translate-y-1/2 left-2 z-hud flex flex-col bg-white rounded-md b-1 b-black/10 shadow-md"
>
  {#each PALLETTE as pcolor, i}
    <button
      class="flexcc h7 w7 group"
      aria-label="Pick color pallette"
      onclick={(ev) => onPickMain(ev, i)}
      oncontextmenu={(ev) => (ev.preventDefault(), onPickAlt(ev, i))}
    >
      <span
        use:c={[
          "flexcc h-5 w-5 b b-black/10 relative z-20 rounded-full group-hover:scale-110",
          {
            "scale-110": i === mainColor || i === altColor,
          },
        ]}
        style={pcolor ? `background-color: ${pcolor};` : ""}
      >
        {#if !pcolor}
          <span class="text-[27px] mb1.25 text-red-500 font-thin">&times;</span>
        {/if}
      </span>
    </button>
  {/each}
  <div
    class="absolute opacity-50 z-10 transition-[top,background-color] b b-black/20 rounded-md top-0 h-7 w-7"
    style={`
      top: ${mainColor * 1.75}rem;
      background-color: ${PALLETTE[mainColor] || "#666"};
    `}
  ></div>
  <div
    class="absolute opacity-50 z-10 transition-[top,border-color] b-2 b-black/0 rounded-md top-0 h-7 w-7"
    style={`
      top: ${altColor * 1.75}rem;
      border-color: ${PALLETTE[altColor] || "#666"};
    `}
  ></div>
</div>
