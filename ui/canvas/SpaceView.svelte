<script lang="ts">
  import { onMount } from "svelte";
  import { cx } from "@center/snippets";
  import SS from "@stores/main.svelte";
  import type { Viewport } from "@stores/space.svelte";

  const S = SS.store;

  const {
    children,
    onViewportChange,
  }: {
    children: any;
    onViewportChange: (vp: Viewport) => void;
  } = $props();

  const transform = $derived.by(() => {
    const { x, y, z } = S.pos;
    const { width: w, height: h } = S.vp;
    const units = S.grid.size;
    return `transform: translateX(${x * units * z + w / 2}px) translateY(${y * units * z + h / 2}px) scale(${z})`;
  });

  let el = $state<HTMLDivElement>(null!);

  onMount(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      triggerViewportChange();
    });
    resizeObserver.observe(el);

    window.addEventListener("resize", triggerViewportChange);

    function triggerViewportChange() {
      const {
        width,
        height,
        left: offsetX,
        top: offsetY,
      } = el.getBoundingClientRect();
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      onViewportChange({
        width,
        height,
        offsetX,
        offsetY,
        screenW,
        screenH,
      });
    }

    triggerViewportChange();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", triggerViewportChange);
    };
  });
</script>

<!-- bind:this={S.containerEl} -->
<div
  bind:this={el}
  onmouseup={S.ev.mouseup("container")}
  onmousemove={S.ev.mousemove("container")}
  onwheel={S.ev.wheel("container")}
  onmousedown={S.ev.containerMouseDown}
  oncontextmenu={(ev) => ev.preventDefault()}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing":
      S.dragState.type === "panning" || S.dragState.type === "movingFrames",
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
