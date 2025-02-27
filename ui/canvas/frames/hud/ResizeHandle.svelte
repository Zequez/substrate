<script lang="ts">
  import SS, { type BoxResizeHandles } from "@stores/main.svelte";
  const S = SS.store;

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
      t: " -top-1 left-2 right-2 h2 cursor-ns-resize z-90",
      b: "-bottom-1 left-2 right-2 h2 cursor-ns-resize z-90",
      l: "-left-1 top-2 bottom-2 w2 cursor-ew-resize z-90",
      r: "-right-1 top-2 bottom-2  w2 cursor-ew-resize z-90",
      tl: "-top-1 -left-1 w4 h4 cursor-nwse-resize z-100",
      tr: "-top-1 -right-1 w4 h4 cursor-nesw-resize z-100",
      bl: " -bottom-1 -left-1 left w4 h4 cursor-nesw-resize z-100",
      br: "-bottom-1 -right-1 w4 h4  cursor-nwse-resize z-100",
    }[props.pos]
  );

  const boxScale = $derived(
    {
      t: "scaleY",
      b: "scaleY",
      l: "scaleX",
      r: "scaleX",
      tl: "scale",
      tr: "scale",
      bl: "scale",
      br: "scale",
    }[props.pos]
  );
</script>

<button
  aria-label={`Resize frame ${label}`}
  class={`absolute pointer-events-auto ${boxClass} hover:bg-black/20 active:bg-gray-700 rounded-sm`}
  style={`transform: ${boxScale}(${1 / S.pos.z});`}
  onmousedown={(ev) => props.onMouseDown(ev, props.pos)}
>
</button>
