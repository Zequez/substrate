<script lang="ts">
  import cx from "classnames";
  import { WeaveClient } from "@theweave/api";
  import { onMount } from "svelte";
  import { adjustRectToGrid, renderGrid } from "../lib/grid";
  import {
    EXAMPLE,
    computeFrames,
    type BoxedFrame,
    normalizeFrame,
    rollDownFrame,
  } from "../lib/Frame";

  let { weaveClient }: { weaveClient?: WeaveClient } = $props();

  const gridSize = 30;
  let gridEl: HTMLCanvasElement;
  let gridCursorEl: HTMLCanvasElement;

  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let mouseX = $state(0);
  let mouseY = $state(0);
  let zPanX = $derived(panX * zoom);
  let zPanY = $derived(panY * zoom);
  let zGridSize = $derived(gridSize * zoom);

  let computedFrames = $derived(computeFrames(EXAMPLE));

  function mouseToGridPos(x: number, y: number) {
    const gridX = Math.floor((x - zPanX) / zGridSize);
    const gridY = Math.floor((y - zPanY) / zGridSize);
    return [gridX, gridY];
  }

  let isPanning = $state(false);
  function handleMouseDown(ev: MouseEvent) {
    if (ev.button === 0) {
      isCreatingFrame = true;
    }
    if (ev.button === 1) {
      isPanning = true;
      ev.clientX;
      ev.clientY;
    }
  }

  let frames = $state<BoxedFrame[]>([]);
  let workingFrame = $state<null | BoxedFrame>(null);
  let normalizedWorkingFrame = $derived(normalizeFrame(workingFrame));
  let frameIsValid = $derived.by(() => {
    return workingFrame.box.w * workingFrame.box.h > 4;
  });
  let isCreatingFrame = $state(false);
  function handleMouseMove(ev: MouseEvent) {
    mouseX = ev.clientX;
    mouseY = ev.clientY;

    const [currentX, currentY] = mouseToGridPos(mouseX, mouseY);
    if (isCreatingFrame) {
      // PIN the frame and allow it to expand with cursor movement
      // x & y stay static
      // w & h can get both positive and negative values
      const towardsLeft = currentX < workingFrame.box.x;
      const towardsUp = currentY < workingFrame.box.y;
      workingFrame.box = {
        ...workingFrame.box,
        w: currentX - workingFrame.box.x + (towardsLeft ? -1 : 1),
        h: currentY - workingFrame.box.y + (towardsUp ? -1 : 1),
      };
    } else {
      if (
        !workingFrame ||
        workingFrame.box.x !== currentX ||
        workingFrame.box.y !== currentY
      ) {
        workingFrame = {
          box: {
            x: currentX,
            y: currentY,
            w: 1,
            h: 1,
          },
          assetUrl: "weave://vines.lightningrodlabs/topic/substrate",
          split: null,
        };
      }
    }

    if (isPanning) {
      panX += ev.movementX / zoom;
      panY += ev.movementY / zoom;
    }
  }

  function handleMouseUp() {
    isPanning = false;
    if (isCreatingFrame) {
      isCreatingFrame = false;
      // Create frame

      const normalized = normalizeFrame(workingFrame);
      frames = [...frames, normalized];
      workingFrame = rollDownFrame(workingFrame);
    }
  }

  const maxZoom = 4; // x4 the original size
  const minZoom = 0.5;
  const zoomStep = 0.001; // % zoomed for each deltaY
  function handleWheel(ev: WheelEvent) {
    ev.preventDefault();
    setZoom(zoom + ev.deltaY * zoomStep, ev.clientX, ev.clientY);
  }

  function setZoom(newZoom: number, centerX?: number, centerY?: number) {
    if (!centerX) centerX = width / 2;
    if (!centerY) centerY = height / 2;
    let processedZoom = newZoom;
    if (newZoom < minZoom) processedZoom = minZoom;
    if (newZoom > maxZoom) processedZoom = maxZoom;
    const zoomDelta = 1 - processedZoom / zoom;
    if (zoomDelta !== 0) {
      const screenPos = screenToCanvasPos(centerX, centerY);
      panX += (screenPos[0] * zoomDelta) / processedZoom;
      panY += (screenPos[1] * zoomDelta) / processedZoom;
    }
    zoom = processedZoom;
  }

  function screenToCanvasPos(x: number, y: number) {
    const imgBox = gridEl.getBoundingClientRect();
    const relativeX = x - imgBox.left;
    const relativeY = y - imgBox.top;
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
</script>

<div
  onmousedown={handleMouseDown}
  onmouseup={handleMouseUp}
  onmousemove={handleMouseMove}
  onwheel={handleWheel}
  role="presentation"
  class={cx("absolute inset-0 overflow-hidden", {
    "cursor-grabbing": isPanning,
  })}
>
  <canvas class="h-full w-full absolute top-0 left-0" bind:this={gridEl}
  ></canvas>

  <div
    class="absolute top-0 left-0 pointer-events-none"
    style={`transform: translateX(${zPanX}px) translateY(${zPanY}px) scale(${zoom})`}
  >
    {#if workingFrame}
      {@const frame = normalizedWorkingFrame}
      <div
        style={`
      width: ${gridSize * frame.box.w}px;
      height: ${gridSize * frame.box.h}px;
      transform: translateX(${frame.box.x * gridSize}px) translateY(${frame.box.y * gridSize}px);
    `}
        class={cx("z-60  b-2  absolute top-0 left-0 rounded-md", {
          "bg-sky-500/10 b-sky-500/60": !frameIsValid,
          "bg-sky-500/50 b-sky-500/100": frameIsValid,
        })}
      ></div>
    {/if}
    {#each frames as frame}
      <div
        style={`
          width: ${gridSize * frame.box.w}px;
          height: ${gridSize * frame.box.h}px;
          transform: translateX(${frame.box.x * gridSize}px) translateY(${frame.box.y * gridSize}px);
        `}
        class="z-50 bg-gray-100 b-2 b-gray-300 absolute top-0 left-0 rounded-md shadow-md"
      >
        {frame.assetUrl}
      </div>
    {/each}
    {#each computedFrames as frame}
      <div
        style={`
          width: ${gridSize * frame.box.w}px;
          height: ${gridSize * frame.box.h}px;
          transform: translateX(${frame.box.x * gridSize}px) translateY(${frame.box.y * gridSize}px);
        `}
        class="z-50 bg-gray-100 b-2 b-gray-300 absolute top-0 left-0 rounded-md shadow-md"
      >
        {frame.assetUrl}
      </div>
    {/each}
  </div>
</div>

{#if zoom !== 1}
  <button
    class="absolute bottom-2 right-2 px2 py1 bg-white rounded-md text-xs z-100"
    onclick={() => setZoom(1)}
  >
    {Math.round(zoom * 100)}%
  </button>
{/if}

<canvas
  class="absolute top-0 left-0 w-full h-full pointer-events-none"
  bind:this={gridCursorEl}
></canvas>
