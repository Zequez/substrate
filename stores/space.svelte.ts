import { onMount } from "svelte";
import type { Box } from "../center/Frame";
import { maybeReadLS } from "../center/snippets/utils";

function spaceStore(config: { centerAt: Box | null }) {
  const gridSize = 30;
  const maxZoom = 4; // x4 the original size
  let minZoom = $state(0.5);
  const zoomStep = 0.001; // % zoomed for each deltaY

  let width = $state(0);
  let height = $state(0);

  const zoomPanLSKey = "ZPXPY";

  const initialPos = (() => {
    if (config.centerAt) {
      const { x, y, w, h } = config.centerAt;
      console.log("Setting zoom and pan to be centered on linked frame");
      return {
        zoom: 1,
        panX: -(x + w / 2),
        panY: -(y + h / 2),
      };
    } else {
      return maybeReadLS(zoomPanLSKey, { zoom: 1, panX: 0, panY: 0 });
    }
  })();

  console.log("INITIAL POS", initialPos);

  let zoom = $state(initialPos.zoom);
  let panX = $state(initialPos.panX);
  let panY = $state(initialPos.panY);

  // If no centerAt is provided, save zoom and pan when they change
  if (!config.centerAt) {
    $effect.root(() => {
      let timeout: any = 0;
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
    });
  }

  let zWidth = $derived(width * zoom);
  let zHeight = $derived(height * zoom);

  let mouseX = $state(0);
  let mouseY = $state(0);
  let [mouseGridX, mouseGridY] = $derived(mouseToGridPos(mouseX, mouseY));
  let mouseBox = $derived<Box>({ x: mouseGridX, y: mouseGridY, w: 1, h: 1 });

  let zPanX = $derived(panX * zoom);
  let zPanY = $derived(panY * zoom);
  let zGridSize = $derived(gridSize * zoom);

  const viewportMargin = 2;
  let viewport = $derived({
    x: -panX - width / 2 / gridSize / zoom - viewportMargin,
    y: -panY - height / 2 / gridSize / zoom - viewportMargin,
    w: width / gridSize / zoom + viewportMargin,
    h: height / gridSize / zoom + viewportMargin,
  });

  function mountInit() {
    onMount(() => {
      function readViewport() {
        setViewport(window.document.documentElement.getBoundingClientRect());
      }

      function setViewport(rect: DOMRect) {
        width = rect.width;
        height = rect.height;
      }

      readViewport();

      window.addEventListener("resize", readViewport);

      return () => {
        window.removeEventListener("resize", readViewport);
      };
    });
  }

  function mouseToGridPos(x: number, y: number) {
    const gridX = Math.floor(
      (x - panX * zoom * gridSize - width / 2) / gridSize / zoom
    );
    const gridY = Math.floor(
      (y - panY * zoom * gridSize - height / 2) / gridSize / zoom
    );
    return [gridX, gridY];
  }

  function screenToCanvasPos(x: number, y: number) {
    const relativeX = x - 0 - width / 2;
    const relativeY = y - 0 - height / 2;
    return [relativeX, relativeY] as [number, number];
  }

  const boxToPx = (box: Box): Box => ({
    x: box.x * gridSize,
    y: box.y * gridSize,
    w: box.w * gridSize,
    h: box.h * gridSize,
  });

  function setZoom(newZoom: number, centerX?: number, centerY?: number) {
    if (!centerX) centerX = width / 2;
    if (!centerY) centerY = height / 2;
    let processedZoom = newZoom;
    if (newZoom < minZoom) processedZoom = minZoom;
    if (newZoom > maxZoom) processedZoom = maxZoom;
    const zoomDelta = 1 - processedZoom / zoom;
    if (zoomDelta !== 0) {
      const screenPos = screenToCanvasPos(centerX, centerY);
      panX += (screenPos[0] * zoomDelta) / processedZoom / gridSize;
      panY += (screenPos[1] * zoomDelta) / processedZoom / gridSize;
    }
    zoom = processedZoom;
  }

  function setMinZoomToFitBox(box: Box) {
    const w = (box.w + 5) * gridSize;
    const h = (box.h + 5) * gridSize;
    const zoomForW = width / w;
    const zoomForH = height / h;
    minZoom = Math.min(zoomForW, zoomForH, 0.5);
  }

  function panZoomToFit(box: Box) {
    const w = (box.w + 5) * gridSize;
    const h = (box.h + 5) * gridSize;
    const zoomForW = width / w;
    const zoomForH = height / h;
    const newZoom = Math.min(zoomForW, zoomForH, 0.5);
    zoom = newZoom;
    const newPanX = box.x + box.w / 2 + 2.5 - (width * zoom) / gridSize / 2;
    const newPanY = box.y + box.h / 2 + 2.5 - (height * zoom) / gridSize / 2;
    panX = -newPanX;
    panY = -newPanY;
  }

  function transform() {
    return `transform: translateX(${panX * gridSize * zoom + width / 2}px) translateY(${panY * gridSize * zoom + height / 2}px) scale(${zoom})`;
  }

  function boxStyle(box: Box, scale: number = 1) {
    const pxBox = boxToPx(box);
    return `
      width: ${pxBox.w}px;
      height: ${pxBox.h}px;
      transform: translateX(${pxBox.x}px) translateY(${pxBox.y}px) scale(${scale});
    `;
  }

  const borderRadius = $derived((1 / zoom) * (zoom > 0.2 ? 6 : 4));

  return {
    mountInit,
    setMinZoomToFitBox,
    panZoomToFit,
    transform,
    boxStyle,
    get boxBorderRadius() {
      return `border-radius: ${borderRadius}px;`;
    },
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    grid: {
      size: gridSize,
      get zSize() {
        return zGridSize;
      },
      toPx: (n: number) => n * gridSize,
      boxToPx,
    },
    pos: {
      get viewport() {
        return viewport;
      },
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
      setZoomFromWheel: (ev: WheelEvent, reverse: boolean = false) => {
        setZoom(
          zoom + ev.deltaY * zoomStep * (reverse ? -1 : 1),
          ev.clientX,
          ev.clientY
        );
      },
    },
    mouse: {
      setXY(x: number, y: number) {
        mouseX = x;
        mouseY = y;
      },
      pan(deltaX: number, deltaY: number) {
        panX = panX + deltaX / zoom / gridSize;
        panY = panY + deltaY / zoom / gridSize;
      },
      get gridX() {
        return mouseGridX;
      },
      get gridY() {
        return mouseGridY;
      },
      get clientX() {
        return mouseX;
      },
      get clientY() {
        return mouseY;
      },
      get box() {
        return mouseBox;
      },
    },
    screenToCanvasPos,
    mouseToGridPos,
  };
}

export default spaceStore;

// Utils
