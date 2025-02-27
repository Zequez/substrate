<script lang="ts">
  import { onMount } from "svelte";
  import { cx } from "@center/snippets";
  import SS from "@stores/main.svelte";
  import type { Pos, Viewport } from "@stores/space.svelte";

  const S = SS.store;

  const {
    children,
    parentPos,
    onViewportChange,
  }: {
    children: any;
    parentPos: Pos;
    onViewportChange: (vp: Viewport) => void;
  } = $props();

  $effect(() => {
    parentPos.x, parentPos.y, parentPos.z;
    triggerViewportChange();
  });

  const transform = $derived.by(() => {
    const { x, y, z } = S.pos;
    const units = S.grid.size;
    return `transform: translateX(${(x * units + S.vp.renderedWidth / 2) * z}px) translateY(${(y * units + S.vp.renderedHeight / 2) * z}px) scale(${z})`;
  });

  let el = $state<HTMLDivElement>(null!);

  function triggerViewportChange() {
    const {
      width,
      height,
      left: offsetX,
      top: offsetY,
    } = el.getBoundingClientRect();

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    if (parentPos.z) {
      onViewportChange({
        width: width / parentPos.z,
        height: height / parentPos.z,
        renderedWidth: width,
        renderedHeight: height,
        offsetX,
        offsetY,
        screenW,
        screenH,
        scaled: parentPos.z,
      });
    }
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      triggerViewportChange();
    });
    resizeObserver.observe(el);

    window.addEventListener("resize", triggerViewportChange);

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
  class={cx("absolute inset-0 overflow-hidden ", {
    "cursor-grabbing":
      S.dragState.type === "panning" || S.dragState.type === "movingFrames",
  })}
>
  <!-- This centers the grid so that 0,0 is in the middle of the screen -->
  <div
    class={cx("absolute top-0 left-0 size-full will-change-transform", {
      "z-frames-container": !S.expandedFrame,
    })}
    style={S.expandedFrame ? "" : transform}
  >
    {#if S.vp.width && S.vp.height}
      {@render children?.()}
    {/if}
  </div>
</div>
