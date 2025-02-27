<script lang="ts">
  import SS from "@stores/main.svelte";
  import type { Pos, Viewport } from "@stores/space.svelte";

  const S = SS.store;

  const {
    pos,
    vp,
    size,
    color,
  }: {
    pos: Pos;
    vp: Viewport;
    size: number;
    color: string;
  } = $props();

  console.log("GRID", pos, vp, size);

  let el = $state<HTMLCanvasElement>(null!);
  let ctx = $derived(el ? el.getContext("2d")! : null!);

  let prevWidth = 0;
  let prevHeight = 0;
  $effect(() => {
    if (vp.width !== prevWidth || vp.height !== prevHeight) {
      el.width = vp.width;
      el.height = vp.height;
    }
    if (ctx && vp.width > 0 && vp.height > 0) {
      renderGrid();
    }
    prevHeight = vp.height;
    prevWidth = vp.width;
  });

  function renderGrid() {
    const lineColor = color + "3";
    const centerColor = color + "6";
    const bgColor = color + "2";

    // const gridSize = (zoom > 1 ? 15 : zoom === 0.5 ? 60 : 30) * zoom;
    const gridSize = (size * pos.z) / vp.scaled;

    const physicalPanX = pos.x * gridSize + vp.width / 2 + 0;
    const physicalPanY = pos.y * gridSize + vp.height / 2 + 0;

    // Clear the canvas
    ctx.clearRect(0, 0, vp.width, vp.height);

    if (pos.z <= 0.08) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, vp.width, vp.height);
    } else {
      // Draw the grid
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.5;

      // Apply panning and zooming
      ctx.save();
      ctx.translate(
        (physicalPanX % gridSize) - gridSize,
        (physicalPanY % gridSize) - gridSize
      );

      // Vertical lines
      for (let x = 0; x <= vp.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, vp.height + gridSize * 2);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= vp.height + gridSize * 2; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(vp.width + gridSize, y);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = centerColor;

    // Center lines

    if (physicalPanX > 0 && physicalPanX < vp.width) {
      const centerX = physicalPanX;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, vp.height);
      ctx.stroke();
    }

    if (physicalPanY > 0 && physicalPanY < vp.height) {
      const centerY = physicalPanY;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(vp.width, centerY);
      ctx.stroke();
    }
  }
</script>

<canvas
  class="h-full w-full absolute top-0 left-0 z-grid pointer-events-none"
  bind:this={el}
></canvas>
