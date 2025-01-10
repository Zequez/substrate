import {
  type BoxedFrame,
  normalizeFrame,
  type Box,
  rollDownFrame,
  normalizeBox,
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
let [mouseGridX, mouseGridY] = $derived(mouseToGridPos(mouseX, mouseY));
let mouseBox = $derived<Box>({ x: mouseGridX, y: mouseGridY, w: 1, h: 1 });

let zPanX = $derived(panX * zoom);
let zPanY = $derived(panY * zoom);
let zGridSize = $derived(gridSize * zoom);

let frames = $state<BoxedFrame[]>([]);

//  █████╗  ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
// ██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
// ███████║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
// ██╔══██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
// ██║  ██║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
// ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝

type BoxResizeHandles = "l" | "r" | "b" | "t" | "tr" | "br" | "tl" | "bl";

type MouseDownActions =
  | { type: "none" }
  | { type: "pan" }
  | { type: "createFrame"; box: Box; boxNormalized: Box }
  | {
      type: "moveFrame";
      i: number;
      startX: number;
      startY: number;
      boxDelta: { x: number; y: number };
    }
  | {
      type: "resizeFrame";
      pos: BoxResizeHandles;
      i: number;
      startX: number;
      startY: number;
      newBox: Box;
    };
let mouseDown = $state<MouseDownActions>({ type: "none" });

function handleMouseDown(
  ev: MouseEvent,
  target?: ["frame-picker", number] | ["frame-resize", BoxResizeHandles, number]
) {
  if (target) {
    ev.stopPropagation();
    switch (target[0]) {
      case "frame-picker": {
        const [startX, startY] = mouseToGridPos(ev.clientX, ev.clientY);
        mouseDown = {
          type: "moveFrame",
          i: target[1],
          startX,
          startY,
          boxDelta: {
            x: 0,
            y: 0,
          },
        };
        break;
      }
      case "frame-resize": {
        const [startX, startY] = mouseToGridPos(ev.clientX, ev.clientY);
        mouseDown = {
          type: "resizeFrame",
          pos: target[1],
          i: target[2],
          startX,
          startY,
          newBox: frames[target[2]].box,
        };
      }
    }
  } else {
    if (ev.button === 1) {
      mouseDown = { type: "pan" };
    } else if (ev.button === 0) {
      mouseDown = {
        type: "createFrame",
        box: mouseBox,
        boxNormalized: mouseBox,
      };
    }
  }
}

function handleMouseMove(ev: MouseEvent) {
  mouseX = ev.clientX;
  mouseY = ev.clientY;

  switch (mouseDown.type) {
    case "pan":
      panX = panX + ev.movementX / zoom;
      panY = panY + ev.movementY / zoom;
      break;
    case "createFrame": {
      // PIN the frame and allow it to expand with cursor movement
      // x & y stay static
      // w & h can get both positive and negative values
      const towardsLeft = mouseGridX < mouseDown.box.x;
      const towardsUp = mouseGridY < mouseDown.box.y;
      mouseDown.box = {
        ...mouseDown.box,
        w: mouseGridX - mouseDown.box.x + (towardsLeft ? -1 : 1),
        h: mouseGridY - mouseDown.box.y + (towardsUp ? -1 : 1),
      };
      mouseDown.boxNormalized = normalizeBox(mouseDown.box);
      break;
    }
    case "moveFrame": {
      const boxDelta = {
        x: mouseGridX - mouseDown.startX,
        y: mouseGridY - mouseDown.startY,
      };
      mouseDown.boxDelta.x = boxDelta.x;
      mouseDown.boxDelta.y = boxDelta.y;
      break;
    }
    case "resizeFrame": {
      const frame = frames[mouseDown.i];
      // let minX = -Infinity;
      // let maxX = Infinity;
      // let minY = -Infinity;
      // let maxY = Infinity;
      let deltaX = mouseGridX - mouseDown.startX;
      let deltaY = mouseGridY - mouseDown.startY;
      // mouseGridX - mouseDown.startX
      // mouseGridY - mouseDown.startY;
      if (mouseDown.pos === "l") {
        mouseDown.newBox = {
          ...frame.box,
          x: Math.min(frame.box.x + deltaX, frame.box.x + frame.box.w - 2),
          w: Math.max(2, frame.box.w - deltaX),
        };
      } else if (mouseDown.pos === "r") {
        mouseDown.newBox = {
          ...frame.box,
          w: Math.max(2, frame.box.w + deltaX),
        };
      } else if (mouseDown.pos === "t") {
        mouseDown.newBox = {
          ...frame.box,
          y: Math.min(frame.box.y + deltaY, frame.box.y + frame.box.h - 2),
          h: Math.max(2, frame.box.h - deltaY),
        };
      } else if (mouseDown.pos === "b") {
        mouseDown.newBox = {
          ...frame.box,
          h: Math.max(2, frame.box.h + deltaY),
        };
      } else if (mouseDown.pos === "br") {
        mouseDown.newBox = {
          ...frame.box,
          h: Math.max(2, frame.box.h + deltaY),
          w: Math.max(2, frame.box.w + deltaX),
        };
      } else if (mouseDown.pos === "tl") {
        mouseDown.newBox = {
          ...frame.box,
          y: Math.min(frame.box.y + deltaY, frame.box.y + frame.box.h - 2),
          h: Math.max(2, frame.box.h - deltaY),
          x: Math.min(frame.box.x + deltaX, frame.box.x + frame.box.w - 2),
          w: Math.max(2, frame.box.w - deltaX),
        };
      } else if (mouseDown.pos === "tr") {
        mouseDown.newBox = {
          ...frame.box,
          y: Math.min(frame.box.y + deltaY, frame.box.y + frame.box.h - 2),
          h: Math.max(2, frame.box.h - deltaY),
          w: Math.max(2, frame.box.w + deltaX),
        };
      } else if (mouseDown.pos === "bl") {
        mouseDown.newBox = {
          ...frame.box,
          h: Math.max(2, frame.box.h + deltaY),
          x: Math.min(frame.box.x + deltaX, frame.box.x + frame.box.w - 2),
          w: Math.max(2, frame.box.w - deltaX),
        };
      }
    }
  }
}

function handleMouseUp() {
  switch (mouseDown.type) {
    case "createFrame": {
      const newFrame: BoxedFrame = {
        box: mouseDown.boxNormalized,
        assetUrl: "Nothing",
        split: null,
      };
      frames = [...frames, newFrame];
      break;
    }
    case "moveFrame": {
      const frame = frames[mouseDown.i];
      frame.box.x += mouseDown.boxDelta.x;
      frame.box.y += mouseDown.boxDelta.y;
      break;
    }
    case "resizeFrame": {
      const frame = frames[mouseDown.i];
      frame.box = mouseDown.newBox;
    }
    default: {
      console.log("Nothing to do on mouse up for", mouseDown.type);
    }
  }
  mouseDown = { type: "none" };
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
  onMount(() => {
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
  get currentAction() {
    return mouseDown;
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
  get frames() {
    return frames;
  },
  gridToPx: (n: number) => n * gridSize,
  boxInPx: (box: Box): Box => ({
    x: box.x * gridSize,
    y: box.y * gridSize,
    w: box.w * gridSize,
    h: box.h * gridSize,
  }),
  get mouseBox(): Box {
    return mouseBox;
  },
};

export default state;
