<script lang="ts">
  import cx from "classnames";
  import { WeaveClient } from "@theweave/api";
  import { onMount } from "svelte";

  let { weaveClient }: { weaveClient?: WeaveClient } = $props();

  let gridEl: HTMLCanvasElement;

  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);

  let isPanning = $state(false);
  function handleMouseDown(ev: MouseEvent) {
    if (ev.button === 1) {
      isPanning = true;
      ev.clientX;
      ev.clientY;
    }
  }

  function handleMouseMove(ev: MouseEvent) {
    if (isPanning) {
      panX += ev.movementX / zoom;
      panY += ev.movementY / zoom;
    }
  }

  function handleMouseUp() {
    isPanning = false;
  }

  const maxZoom = 4; // x4 the original size
  const minZoom = 0.5;
  const zoomStep = 0.001; // % zoomed for each deltaY
  function handleWheel(ev: WheelEvent) {
    ev.preventDefault();
    const prevZoom = zoom;
    zoom += ev.deltaY * zoomStep;
    if (zoom < minZoom) zoom = minZoom;
    if (zoom > maxZoom) zoom = maxZoom;
    const zoomDelta = 1 - zoom / prevZoom;
    if (zoomDelta !== 0) {
      const screenPos = screenToCanvasPos(ev);
      panX += (screenPos[0] * zoomDelta) / zoom;
      panY += (screenPos[1] * zoomDelta) / zoom;
    }
  }

  function screenToCanvasPos(ev: { clientX: number; clientY: number }) {
    const imgBox = gridEl.getBoundingClientRect();
    const relativeX = ev.clientX - imgBox.left;
    const relativeY = ev.clientY - imgBox.top;
    return [relativeX, relativeY] as [number, number];
  }

  let width = $state(0);
  let height = $state(0);
  onMount(() => {
    function initializeCanvas() {
      const box = gridEl.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) {
        requestAnimationFrame(initializeCanvas); // Retry on the next frame
      } else {
        width = box.width;
        height = box.height;
        panX = width / 2;
        panY = height / 2;
        gridEl.width = width;
        gridEl.height = height;
      }
    }

    initializeCanvas(); // Start initialization
  });

  $effect(drawGrid);

  const gridColor = "#fff3";
  function drawGrid() {
    // const gridSize = (zoom > 1 ? 15 : zoom === 0.5 ? 60 : 30) * zoom;
    const gridSize = 30 * zoom;

    if (width === 0) {
      console.log(
        gridEl.parentElement,
        gridEl.parentElement.getBoundingClientRect()
      );
    }

    const physicalPanX = panX * zoom;
    const physicalPanY = panY * zoom;

    const ctx = gridEl.getContext("2d");

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw the grid
    ctx.strokeStyle = gridColor;
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

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff6";

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

  $effect(() => {
    console.log(gridEl);
  });
</script>

<canvas
  onmousedown={handleMouseDown}
  onmouseup={handleMouseUp}
  onmousemove={handleMouseMove}
  onwheel={handleWheel}
  class={cx("h-full w-full", {
    "cursor-grabbing": isPanning,
  })}
  bind:this={gridEl}
></canvas>
