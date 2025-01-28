<script lang="ts">
  import { type BoxResizeHandles } from "../lib/stores";
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
      t: " -top-1 left-2 right-2 h2 cursor-ns-resize z-40",
      b: "-bottom-1 left-2 right-2 h2 cursor-ns-resize z-40",
      l: "-left-1 top-2 bottom-2 w2 cursor-ew-resize z-40",
      r: "-right-1 top-2 bottom-2  w2 cursor-ew-resize z-40",
      tl: "-top-1 -left-1 w4 h4 cursor-nwse-resize z-50",
      tr: "-top-1 -right-1 w4 h4 cursor-nesw-resize z-50",
      bl: " -bottom-1 -left-1 left w4 h4 cursor-nesw-resize z-50",
      br: "-bottom-1 -right-1 w4 h4  cursor-nwse-resize z-50",
    }[props.pos]
  );
</script>

<button
  aria-label={`Resize frame ${label}`}
  class={`absolute z-40 ${boxClass} hover:bg-black/10 active:bg-black/10`}
  onmousedown={(ev) => props.onMouseDown(ev, props.pos)}
>
</button>
