<script lang="ts">
  import { cx } from "@center/snippets";
  import SS from "@stores/main.svelte";

  const S = SS.store;

  const {
    children,
    x,
    y,
    units,
    z,
    w,
    h,
  }: {
    children: any;
    x: number;
    y: number;
    units: number;
    z: number;
    w: number;
    h: number;
  } = $props();

  const transform = $derived(
    `transform: translateX(${x * units * z + w / 2}px) translateY(${y * units * z + h / 2}px) scale(${z})`
  );
</script>

<div
  bind:this={S.containerEl}
  onmouseup={S.ev.mouseup}
  onmousemove={S.ev.mousemove}
  onwheel={S.ev.wheel}
  onmousedown={(ev) => S.ev.containerMouseDown(ev)}
  oncontextmenu={(ev) => ev.preventDefault()}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing": S.currentActionIs("pan", "moveFrame"),
  })}
>
  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <div
    class={cx("absolute top-0 left-0 will-change-transform", {
      "z-frames-container": !S.expandedFrame,
    })}
    style={S.expandedFrame ? "" : transform}
  >
    {@render children?.()}
  </div>
</div>
