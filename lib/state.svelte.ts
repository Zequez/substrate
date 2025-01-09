import {
  type BoxedFrame,
  normalizeFrame,
  type Box,
  rollDownFrame,
} from "./Frame";
import { adjustRectToGrid, renderGrid } from "./grid";
import { onMount } from "svelte";

const gridSize = 30;
const maxZoom = 4; // x4 the original size
const minZoom = 0.5;
const zoomStep = 0.001; // % zoomed for each deltaY

let gridEl = $state<HTMLCanvasElement>(null!);
let width = $state(0);
let height = $state(0);
let ctx = $state<CanvasRenderingContext2D>(null!);

let zoom = $state(1);
let panX = $state(0);
let panY = $state(0);
let mouseX = $state(0);
let mouseY = $state(0);
let isPanning = $state(false);

let zPanX = $derived(panX * zoom);
let zPanY = $derived(panY * zoom);
let zGridSize = $derived(gridSize * zoom);

let frames = $state<BoxedFrame[]>([]);
let workingFrame = $state<null | BoxedFrame>(null);
let normalizedWorkingFrame = $derived(
  workingFrame ? normalizeFrame(workingFrame) : null
);
let frameIsValid = $derived(
  workingFrame ? workingFrame.box.w * workingFrame.box.h > 4 : false
);

let isCreatingFrame = $state(false);

function handleMouseDown(ev: MouseEvent) {
  const target = ev.target as HTMLElement;
  const isPickingFrame = parseInt(
    target.getAttribute("data-frame-picker")!,
    10
  );

  if (isNaN(isPickingFrame)) {
    if (ev.button === 0) {
      isCreatingFrame = true;
      console.log("Is creating frame set to true");
    }
    if (ev.button === 1) {
      isPanning = true;
      ev.clientX;
      ev.clientY;
    }
  } else {
    console.log("Frame!");
  }
}

function handleMouseMove(ev: MouseEvent) {
  mouseX = ev.clientX;
  mouseY = ev.clientY;

  const [currentX, currentY] = mouseToGridPos(mouseX, mouseY);
  if (isCreatingFrame && workingFrame) {
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
  if (isCreatingFrame && workingFrame) {
    isCreatingFrame = false;
    // Create frame

    const normalized = normalizeFrame(workingFrame);
    frames = [...frames, normalized];
    workingFrame = rollDownFrame(workingFrame);
  }
}

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

// ███████╗███████╗███████╗███████╗ ██████╗████████╗███████╗
// ██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝╚══██╔══╝██╔════╝
// █████╗  █████╗  █████╗  █████╗  ██║        ██║   ███████╗
// ██╔══╝  ██╔══╝  ██╔══╝  ██╔══╝  ██║        ██║   ╚════██║
// ███████╗██║     ██║     ███████╗╚██████╗   ██║   ███████║
// ╚══════╝╚═╝     ╚═╝     ╚══════╝ ╚═════╝   ╚═╝   ╚══════╝

function init() {
  $effect(() => {
    console.log("GRI CHANGED", gridEl);
    if (gridEl) {
      ctx = gridEl.getContext("2d")!;
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
    }
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

// ██╗   ██╗████████╗██╗██╗     ███████╗
// ██║   ██║╚══██╔══╝██║██║     ██╔════╝
// ██║   ██║   ██║   ██║██║     ███████╗
// ██║   ██║   ██║   ██║██║     ╚════██║
// ╚██████╔╝   ██║   ██║███████╗███████║
//  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝

function mouseToGridPos(x: number, y: number) {
  const gridX = Math.floor((x - zPanX) / zGridSize);
  const gridY = Math.floor((y - zPanY) / zGridSize);
  return [gridX, gridY];
}

function screenToCanvasPos(x: number, y: number) {
  const imgBox = gridEl.getBoundingClientRect();
  const relativeX = x - imgBox.left;
  const relativeY = y - imgBox.top;
  return [relativeX, relativeY] as [number, number];
}

// ██╗███╗   ██╗████████╗███████╗██████╗ ███████╗ █████╗  ██████╗███████╗
// ██║████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔════╝
// ██║██╔██╗ ██║   ██║   █████╗  ██████╔╝█████╗  ███████║██║     █████╗
// ██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██╔══╝  ██╔══██║██║     ██╔══╝
// ██║██║ ╚████║   ██║   ███████╗██║  ██║██║     ██║  ██║╚██████╗███████╗
// ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝

const state = {
  init,
  ev: {
    mousedown: handleMouseDown,
    mousemove: handleMouseMove,
    mouseup: handleMouseUp,
    wheel: handleWheel,
    resetZoom: () => setZoom(1),
  },
  ref: {
    get grid() {
      return gridEl;
    },
    set grid(v: HTMLCanvasElement) {
      gridEl = v;
    },
  },
  gridSize,
  get zGridSize() {
    return zGridSize;
  },
  get isPanning() {
    return isPanning;
  },
  get isCreatingFrame() {
    return isCreatingFrame;
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
  },
  get ghostFrame() {
    return normalizedWorkingFrame;
  },
  get ghostFrameIsValid() {
    return frameIsValid;
  },
  get normalizedWorkingFrame() {
    return normalizedWorkingFrame;
  },
  get frameIsValid() {
    return frameIsValid;
  },
  get frames() {
    return frames;
  },
  get width() {
    return width;
  },
  get height() {
    return height;
  },
  gridToPx: (n: number) => n * gridSize,
  boxInPx: (box: Box): Box => ({
    x: box.x * gridSize,
    y: box.y * gridSize,
    w: box.w * gridSize,
    h: box.h * gridSize,
  }),
};

export default state;
