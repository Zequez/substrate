<script lang="ts">
  import { type BoxResizeHandles } from "../lib/state.svelte";
  const props: {
    pos: BoxResizeHandles;
    onMouseDown: (e: MouseEvent, pos: BoxResizeHandles) => void;
  } = $props();

  const label = $derived(
    {
      t: "top",
      b: "bottom",
      l: "left",
      r: "right",
      tl: "top left",
      tr: "top right",
      bl: "bottom left",
      br: "bottom right",
    }[props.pos]
  );

  const boxClass = $derived(
    {
      t: " -top-1 left-2 right-2 h2 cursor-ns-resize",
      b: "-bottom-1 left-2 right-2 h2 cursor-ns-resize",
      l: "-left-1 top-2 bottom-2 w2 cursor-ew-resize",
      r: "-right-1 top-2 bottom-2  w2 cursor-ew-resize",
      tl: "-top-1 -left-1 w4 h4 cursor-nwse-resize",
      tr: "-top-1 -right-1 w4 h4 cursor-nesw-resize",
      bl: " -bottom-1 -left-1 left w4 h4 cursor-nesw-resize",
      br: "-bottom-1 -right-1 w4 h4  cursor-nwse-resize",
    }[props.pos]
  );
</script>

<button
  aria-label={`Resize frame ${label}`}
  class={`absolute ${boxClass} hover:bg-black/10 active:bg-black/10`}
  onmousedown={(ev) => props.onMouseDown(ev, props.pos)}
>
</button>
