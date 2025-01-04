<script lang="ts">
  import cx from "classnames";
  import { WeaveClient } from "@theweave/api";
  import { onMount } from "svelte";
  import { adjustRectToGrid, renderGrid } from "../lib/grid";

  let { weaveClient }: { weaveClient?: WeaveClient } = $props();

  const gridSize = 30;
  let gridEl: HTMLCanvasElement;
  let gridCursorEl: HTMLCanvasElement;

  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let mouseX = $state(0);
  let mouseY = $state(0);

  let isPanning = $state(false);
  type CreatingRectState = null | {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  let isCreatingRectangle = $state<CreatingRectState>(null);
  function handleMouseDown(ev: MouseEvent) {
    if (ev.button === 0) {
      isCreatingRectangle = {
        startX: ev.clientX,
        startY: ev.clientY,
        endX: ev.clientX + gridSize,
        endY: ev.clientY + gridSize,
      };
    }
    if (ev.button === 1) {
      isPanning = true;
      ev.clientX;
      ev.clientY;
    }
  }

  function handleMouseMove(ev: MouseEvent) {
    mouseX = ev.clientX;
    mouseY = ev.clientY;

    if (isPanning) {
      panX += ev.movementX / zoom;
      panY += ev.movementY / zoom;
    }

    if (isCreatingRectangle) {
    }
  }

  function handleMouseUp() {
    isPanning = false;
    isCreatingRectangle = null;
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
  let ctx = $state<CanvasRenderingContext2D>(null);
  let cursorCtx = $state<CanvasRenderingContext2D>(null);
  onMount(() => {
    ctx = gridEl.getContext("2d");
    cursorCtx = gridCursorEl.getContext("2d");
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
        gridCursorEl.width = width;
        gridCursorEl.height = height;
      }
    }

    initializeCanvas(); // Start initialization
  });

  $effect(() => {
    renderGrid(ctx, {
      width,
      height,
      zoom,
      panX,
      panY,
      color: "#fff3",
      size: gridSize,
    });
  });

  // Render cursor on cursor grid
  $effect(() => {
    const zGridSize = gridSize * zoom;
    const zPanX = panX * zoom;
    const zPanY = panY * zoom;

    function getGridPos(x: number, y: number) {
      const gridX = Math.floor((x - zPanX) / zGridSize);
      const gridY = Math.floor((y - zPanY) / zGridSize);
      return [gridX, gridY];
    }

    const [gridX, gridY] = getGridPos(mouseX, mouseY);

    const rect = {
      startX: gridX * zGridSize + zPanX,
      startY: gridY * zGridSize + zPanY,
      endX: gridX * zGridSize + zGridSize + zPanX,
      endY: gridY * zGridSize + zGridSize + zPanY,
    };

    cursorCtx.clearRect(0, 0, width, height);
    cursorCtx.beginPath();
    cursorCtx.moveTo(rect.startX, rect.endX);
    cursorCtx.fillStyle = "red";
    cursorCtx.fillRect(
      rect.startX,
      rect.startY,
      rect.endX - rect.startX,
      rect.endY - rect.startY
    );

    cursorCtx.stroke();
  });
</script>

<canvas
  onmousedown={handleMouseDown}
  onmouseup={handleMouseUp}
  onmousemove={handleMouseMove}
  onwheel={handleWheel}
  class={cx("h-full w-full absolute top-0 left-0", {
    "cursor-grabbing": isPanning,
  })}
  bind:this={gridEl}
></canvas>

<canvas
  class="absolute top-0 left-0 w-full h-full pointer-events-none"
  bind:this={gridCursorEl}
></canvas>
