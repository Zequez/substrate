<script lang="ts">
  import SS from "@stores/main.svelte";

  const S = SS.store;

  const {
    x: panX,
    y: panY,
    units: size,
    z: zoom,
    w: width,
    h: height,
    color,
  }: {
    x: number;
    y: number;
    units: number;
    z: number;
    w: number;
    h: number;
    color: string;
  } = $props();

  let el = $state<HTMLCanvasElement>(null!);
  let ctx = $derived(el ? el.getContext("2d")! : null!);

  let prevWidth = 0;
  let prevHeight = 0;
  $effect(() => {
    if (width !== prevWidth || height !== prevHeight) {
      el.width = width;
      el.height = height;
    }
    if (ctx && width > 0 && height > 0) {
      renderGrid();
    }
    prevHeight = height;
    prevWidth = width;
  });

  function renderGrid() {
    const lineColor = color + "3";
    const centerColor = color + "6";
    const bgColor = color + "2";

    // const gridSize = (zoom > 1 ? 15 : zoom === 0.5 ? 60 : 30) * zoom;
    const gridSize = size * zoom;

    const physicalPanX = panX * size * zoom + width / 2;
    const physicalPanY = panY * size * zoom + height / 2;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    if (zoom <= 0.08) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
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
      for (let x = 0; x <= width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height + gridSize * 2);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height + gridSize * 2; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width + gridSize, y);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = centerColor;

    // Center lines

    if (physicalPanX > 0 && physicalPanX < width) {
      const centerX = physicalPanX;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();
    }

    if (physicalPanY > 0 && physicalPanY < height) {
      const centerY = physicalPanY;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    }
  }
</script>

<canvas
  class="h-full w-full absolute top-0 left-0 z-grid pointer-events-none"
  bind:this={el}
></canvas>
