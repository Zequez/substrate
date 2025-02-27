import { onMount } from "svelte";
import type { Box } from "../center/Frame";
import { maybeReadLS } from "../center/snippets/utils";
export type Viewport = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  screenW: number;
  screenH: number;
};
function spaceStore(config: { centerAt: Box | null }) {
  const gridSize = 30;
  const maxZoom = 4; // x4 the original size
  let minZoom = $state(0.5);
  const zoomStep = 0.001; // % zoomed for each deltaY

  let vp = $state<Viewport>({
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
    screenW: 0,
    screenH: 0,
  });
  let vpEl = $state<HTMLDivElement>(null!);

  const zoomPanLSKey = "ZPXPY";

  type Pos = {
    x: number;
    y: number;
    z: number;
  };

  const initialPos: Pos = (() => {
    if (config.centerAt) {
      const { x, y, w, h } = config.centerAt;
      console.log("Setting zoom and pan to be centered on linked frame");
      return {
        z: 1,
        x: -(x + w / 2),
        y: -(y + h / 2),
      };
    } else {
      return maybeReadLS(zoomPanLSKey, { z: 1, x: 0, y: 0 });
    }
  })();

  let pos = $state(initialPos);

  // If no centerAt is provided, save zoom and pan when they change
  if (!config.centerAt) {
    $effect.root(() => {
      let timeout: any = 0;
      $effect(() => {
        // Make dependency explicit otherwise doesn't work because $effect.root
        [pos.z, pos.x, pos.y];
        if (timeout) clearTimeout(timeout);
        setTimeout(() => {
          localStorage.setItem(zoomPanLSKey, JSON.stringify({ ...pos }));
        }, 100);
      });
    });
  }

  let mouseX = $state(0);
  let mouseY = $state(0);
  let [mouseGridX, mouseGridY] = $derived(mouseToGridPos(mouseX, mouseY));
  let mouseBox = $derived<Box>({ x: mouseGridX, y: mouseGridY, w: 1, h: 1 });

  const vpBoxMargin = 2;
  let vpBox = $derived({
    x: -pos.z - vp.width / 2 / gridSize / pos.z - vpBoxMargin,
    y: -pos.z - vp.height / 2 / gridSize / pos.z - vpBoxMargin,
    w: vp.width / gridSize / pos.z + vpBoxMargin,
    h: vp.height / gridSize / pos.z + vpBoxMargin,
  });

  function mouseToGridPos(x: number, y: number) {
    const gridX = Math.floor(
      (x - vp.offsetX - pos.x * pos.z * gridSize - vp.width / 2) /
        gridSize /
        pos.z
    );
    const gridY = Math.floor(
      (y - vp.offsetY - pos.y * pos.z * gridSize - vp.height / 2) /
        gridSize /
        pos.z
    );
    return [gridX, gridY];
  }

  function screenToCanvasPos(clientX: number, clientY: number) {
    const relativeX = clientX - vp.offsetX - vp.width / 2;
    const relativeY = clientY - vp.offsetY - vp.height / 2;
    return [relativeX, relativeY] as [number, number];
  }

  const boxToPx = (box: Box): Box => ({
    x: box.x * gridSize,
    y: box.y * gridSize,
    w: box.w * gridSize,
    h: box.h * gridSize,
  });

  function setZoom(newZoom: number, clientX?: number, clientY?: number) {
    if (!clientX) clientX = vp.width / 2 + vp.offsetX;
    if (!clientY) clientY = vp.height / 2 + vp.offsetY;
    console.log("Setting zoom", clientX, clientY);
    let processedZoom = newZoom;
    if (newZoom < minZoom) processedZoom = minZoom;
    if (newZoom > maxZoom) processedZoom = maxZoom;
    const zoomDelta = 1 - processedZoom / pos.z;
    if (zoomDelta !== 0) {
      const canvasPos = screenToCanvasPos(clientX, clientY);
      console.log("Canvas POS", canvasPos);
      pos.x += (canvasPos[0] * zoomDelta) / processedZoom / gridSize;
      pos.y += (canvasPos[1] * zoomDelta) / processedZoom / gridSize;
    }
    pos.z = processedZoom;
  }

  function setMinZoomToFitBox(box: Box) {
    const w = (box.w + 5) * gridSize;
    const h = (box.h + 5) * gridSize;
    const zoomForW = vp.width / w;
    const zoomForH = vp.height / h;
    minZoom = Math.min(zoomForW, zoomForH, 0.5);
  }

  function panZoomToFit(box: Box) {
    const w = (box.w + 5) * gridSize;
    const h = (box.h + 5) * gridSize;
    const zoomForW = vp.width / w;
    const zoomForH = vp.height / h;
    const newZoom = Math.min(zoomForW, zoomForH, 0.5);
    pos.z = newZoom;
    const newPanX = box.x + box.w / 2 + 2.5 - (vp.width * pos.z) / gridSize / 2;
    const newPanY =
      box.y + box.h / 2 + 2.5 - (vp.height * pos.z) / gridSize / 2;
    pos.x = -newPanX;
    pos.y = -newPanY;
  }

  function transform() {
    return `transform: translateX(${pos.x * gridSize * pos.z + vp.width / 2}px) translateY(${pos.y * gridSize * pos.z + vp.height / 2}px) scale(${pos.z})`;
  }

  function boxStyle(box: Box, scale: number = 1) {
    const pxBox = boxToPx(box);
    return `
      width: ${pxBox.w}px;
      height: ${pxBox.h}px;
      transform: translateX(${pxBox.x}px) translateY(${pxBox.y}px) scale(${scale});
    `;
  }

  const borderRadius = $derived((1 / pos.z) * (pos.z > 0.2 ? 6 : 4));

  const commands = {
    setZoom,
    setViewport: (newVp: Viewport) => {
      console.log("Setting viewport", newVp);
      vp = newVp;
    },
    setZoomFromWheel: (delta: number) => {
      setZoom(pos.z + delta * zoomStep, mouseX, mouseY);
    },
    setMouseXY(x: number, y: number) {
      mouseX = x;
      mouseY = y;
    },
    pan(deltaX: number, deltaY: number) {
      if (deltaX || deltaY) {
        pos.x = pos.x + deltaX / pos.z / gridSize;
        pos.y = pos.y + deltaY / pos.z / gridSize;
      }
    },
    setMinZoomToFitBox,
    panZoomToFit,
  };

  return {
    cmd: commands,
    transform,
    boxStyle,
    get vp() {
      return vp;
    },
    get vpEl() {
      return vpEl;
    },
    set vpEl(v: HTMLDivElement) {
      vpEl = v;
    },
    get vpBox() {
      return vpBox;
    },
    get boxBorderRadius() {
      return `border-radius: ${borderRadius}px;`;
    },
    grid: {
      size: gridSize,
      toPx: (n: number) => n * gridSize,
      boxToPx,
    },
    get pos() {
      return pos;
    },
    mouse: {
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
    mouseToGridPos,
  };
}

export default spaceStore;

// Utils
