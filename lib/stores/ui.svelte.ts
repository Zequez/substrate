import { onMount } from "svelte";
import type { Box } from "../../lib/Frame";
import { renderGrid } from "../../lib/grid";

function uiStore(config: { centerAt: Box | null }) {
  const gridSize = 30;
  const maxZoom = 4; // x4 the original size
  const minZoom = 0.5;
  const zoomStep = 0.001; // % zoomed for each deltaY

  let gridEl = $state<HTMLCanvasElement>(null!);
  let width = $state(0);
  let height = $state(0);
  let ctx = $state<CanvasRenderingContext2D>(null!);

  const zoomPanLSKey = "ZPXPY";

  const defaults = (function () {
    if (config.centerAt) {
      const { x, y, w, h } = config.centerAt;
      console.log("Setting zoom and pan to be centered on linked frame");
      // Find center of frame
      const val = {
        zoom: 1,
        panX: -(x + w / 2) * gridSize,
        panY: -(y + h / 2) * gridSize,
      };
      console.log("Centering FRAME", val);
      return val;
    } else {
      const def = { zoom: 1, panX: 0, panY: 0 };
      try {
        return JSON.parse(localStorage.getItem(zoomPanLSKey)!) || def;
      } catch (e) {
        return def;
      }
    }
  })();

  $effect.root(() => {
    let timeout: any = 0;
    if (!config.centerAt) {
      $effect(() => {
        // Make dependency explicit otherwise doesn't work because $effect.root
        [zoom, panX, panY];
        if (timeout) clearTimeout(timeout);
        setTimeout(() => {
          localStorage.setItem(
            zoomPanLSKey,
            JSON.stringify({ zoom, panX, panY })
          );
        }, 100);
      });
    }
  });

  let zoom = $state(defaults.zoom);
  let panX = $state(defaults.panX);
  let panY = $state(defaults.panY);
  let zWidth = $derived(width * zoom);
  let zHeight = $derived(height * zoom);

  let mouseX = $state(0);
  let mouseY = $state(0);
  let [mouseGridX, mouseGridY] = $derived(mouseToGridPos(mouseX, mouseY));
  let mouseBox = $derived<Box>({ x: mouseGridX, y: mouseGridY, w: 1, h: 1 });

  let zPanX = $derived(panX * zoom);
  let zPanY = $derived(panY * zoom);
  let zGridSize = $derived(gridSize * zoom);

  function mountInit() {
    onMount(() => {
      let frameId: any;
      if (gridEl) {
        ctx = gridEl.getContext("2d")!;
        function initializeCanvas() {
          const box = gridEl.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) {
            frameId = requestAnimationFrame(initializeCanvas); // Retry on the next frame
          } else {
            width = box.width;
            height = box.height;
            gridEl.width = width;
            gridEl.height = height;
          }
        }

        initializeCanvas(); // Start initialization
      }

      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      };
    });

    $effect(() => {
      if (!ctx) return;
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
  }

  function mouseToGridPos(x: number, y: number) {
    const gridX = Math.floor((x - zPanX - zWidth / 2) / zGridSize);
    const gridY = Math.floor((y - zPanY - zHeight / 2) / zGridSize);
    return [gridX, gridY];
  }

  function screenToCanvasPos(x: number, y: number) {
    const imgBox = gridEl.getBoundingClientRect();
    const relativeX = x - imgBox.left;
    const relativeY = y - imgBox.top;
    return [relativeX, relativeY] as [number, number];
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

  return {
    mountInit,
    maxZoom,
    minZoom,
    zoomStep,
    grid: {
      get el() {
        return gridEl;
      },
      set el(v: HTMLCanvasElement) {
        gridEl = v;
      },
      size: gridSize,
      get zSize() {
        return zGridSize;
      },
      toPx: (n: number) => n * gridSize,
      boxInPx: (box: Box): Box => ({
        x: box.x * gridSize,
        y: box.y * gridSize,
        w: box.w * gridSize,
        h: box.h * gridSize,
      }),
    },
    pos: {
      get z() {
        return zoom;
      },
      get x() {
        return panX;
      },
      get y() {
        return panY;
      },
      get zx() {
        return zPanX;
      },
      get zy() {
        return zPanY;
      },
      get w() {
        return width;
      },
      get h() {
        return height;
      },
      get zw() {
        return zWidth;
      },
      get zh() {
        return zHeight;
      },
      setZoom,
      setZoomFromWheel: (ev: WheelEvent) => {
        setZoom(zoom + ev.deltaY * zoomStep, ev.clientX, ev.clientY);
      },
    },
    mouse: {
      setXY(x: number, y: number) {
        mouseX = x;
        mouseY = y;
      },
      pan(deltaX: number, deltaY: number) {
        panX = panX + deltaX / zoom;
        panY = panY + deltaY / zoom;
      },
      get gridX() {
        return mouseGridX;
      },
      get gridY() {
        return mouseGridY;
      },
      get box() {
        return mouseBox;
      },
    },
    screenToCanvasPos,
    mouseToGridPos,
  };
}

export default uiStore;
