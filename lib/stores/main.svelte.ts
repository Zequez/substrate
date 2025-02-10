import {
  type BoxedFrame,
  type Box,
  normalizeBox,
  resizeBox,
  containingBox,
  isTouching,
} from "../Frame";

// Sub-states
import thingsStore from "./things";
import assets from "./assets.svelte";
import profiles from "./profiles.svelte";
import clients from "../clients";
import spaceStore from "./space.svelte";
import keyboardStore from "./keyboard.svelte";
import spaceColoring, { type PixelsFlat } from "./spaceColoring.svelte";
import { bresenhamLine, resolveScreenEdgePanning } from "../../lib/utils";

export type BoxResizeHandles =
  | "l"
  | "r"
  | "b"
  | "t"
  | "tr"
  | "br"
  | "tl"
  | "bl";

async function createStore() {
  const appEl = document.getElementById("app")!;

  // Frame stuff
  let frames = $state(
    thingsStore.typeOfThing<"BoxedFrame", BoxedFrame>(
      "BoxedFrame",
      "BOXED_FRAME"
    )
  );

  const frameHash = clients.wal ? clients.wal.hrl[1] : null;
  const frame = frameHash ? frames.findByHash(frameHash) : null;
  let framesSelected = $state<string[]>([]);

  const fitAllBox = $derived(
    containingBox(frames.allFlat.map((f) => f.value.box))
  );
  const framesInViewport = $derived.by(() => {
    return frames.allFlat.filter((f) => {
      return isTouching(ui.pos.viewport, f.value.box);
    });
  });
  let lastInteractionUuid = $state<string | null>(null);

  // Space stuff
  let isInFullscreen = $state<boolean>(!!document.fullscreenElement);
  const ui = spaceStore({ centerAt: frame ? frame.value.box : null });
  const keyboardPan = keyboardStore((x, y) => {
    ui.mouse.pan(x * ui.grid.size * 1.5, y * ui.grid.size * 1.5);
  });
  let isOnGrid = $state(false);

  // Coloring pixels stuff
  let colorPixels = spaceColoring.createStore();
  const colorPixelsInViewport: PixelsFlat[] = $derived.by(() => {
    return colorPixels.pixels.filter(([x, y]) => {
      const vp = ui.pos.viewport;
      return x >= vp.x && x <= vp.x + vp.w && y >= vp.y && y <= vp.y + vp.h;
    });
  });

  // ██╗███╗   ██╗██╗████████╗
  // ██║████╗  ██║██║╚══██╔══╝
  // ██║██╔██╗ ██║██║   ██║
  // ██║██║╚██╗██║██║   ██║
  // ██║██║ ╚████║██║   ██║
  // ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝

  function mountInit() {
    profiles.mountInit();
    ui.mountInit();
    keyboardPan.mountInit();

    $effect(() => {
      if (fitAllBox) {
        ui.setMinZoomToFitBox(fitAllBox);
      }
    });

    appEl.addEventListener("fullscreenchange", (ev) => {
      isInFullscreen = !!document.fullscreenElement;
    });

    let timeoutId: any = null;
    const panSize = (ui.grid.size * 2) / 1.5;
    const edge = 10;
    function processFullscreenEdgePanning() {
      const [panX, panY] = resolveScreenEdgePanning(
        edge,
        ui.mouse.clientX,
        ui.mouse.clientY,
        ui.width,
        ui.height
      );
      if (panX || panY) {
        ui.mouse.pan(panX * panSize, panY * panSize);
      }
      timeoutId = setTimeout(processFullscreenEdgePanning, 25);
    }

    $effect(() => {
      if (isInFullscreen) {
        if (!timeoutId) {
          processFullscreenEdgePanning();
        }
      } else {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });
  }

  //  █████╗  ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
  // ██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
  // ███████║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
  // ██╔══██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
  // ██║  ██║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
  // ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝

  /************************************** */
  // MOUSE DOWN
  /************************************** */

  type MouseDownActions =
    | { type: "none" }
    | { type: "pan" }
    | {
        type: "createFrame";
        box: Box;
        boxNormalized: Box;
        isValid: boolean;
        touchingFrames: string[];
      }
    | {
        type: "moveFrame";
        uuids: string[];
        startX: number;
        startY: number;
        boxDelta: { x: number; y: number };
        trashing: boolean;
        pickX: number;
        pickY: number;
        lastValidBoxDelta: { x: number; y: number };
        isValid: boolean;
      }
    | {
        type: "resizeFrame";
        pos: BoxResizeHandles;
        uuid: string;
        startX: number;
        startY: number;
        newBox: Box;
        lastValidBox: Box;
        isValid: boolean;
      }
    | {
        type: "painting";
        lastX: number;
        lastY: number;
      };

  let mouseDown = $state<MouseDownActions>({ type: "none" });

  function handleMouseDown(
    ev: MouseEvent,
    target:
      | ["create-frame"]
      | ["pan"]
      | ["paint-start"]
      | ["frame-picker", string[]]
      | ["frame-resize", BoxResizeHandles, string]
      | ["copy-link", string]
      | ["remove-asset", string]
      | ["fit-all"]
      | ["toggle-fullscreen"]
  ) {
    ev.stopPropagation();
    switch (target[0]) {
      case "pan": {
        mouseDown = { type: "pan" };
        break;
      }
      case "create-frame": {
        mouseDown = {
          type: "createFrame",
          box: ui.mouse.box,
          boxNormalized: ui.mouse.box,
          isValid: boxIsValid(ui.mouse.box),
          touchingFrames: [],
        };
        break;
      }
      case "paint-start": {
        const [x, y] = ui.mouseToGridPos(ev.clientX, ev.clientY);
        mouseDown = {
          type: "painting",
          lastX: x,
          lastY: y,
        };
        colorPixels.paint(x, y);
        break;
      }
      case "copy-link": {
        const [wal, url] = frames.link(target[1]);
        if (url && wal) {
          navigator.clipboard.writeText(url);
          if (clients.weave) {
            clients.weave.assets.assetToPocket(wal);
          }
        } else {
          alert("Frame isn't on the network yet");
        }

        break;
      }
      case "frame-picker": {
        const [startX, startY] = ui.mouseToGridPos(ev.clientX, ev.clientY);
        const t = (ev.currentTarget as HTMLDivElement).parentElement!;
        const { left, top, width, height } = t.getBoundingClientRect();
        const pickX = (ev.clientX - left) / width;
        const pickY = (ev.clientY - top) / height;

        mouseDown = {
          type: "moveFrame",
          uuids: target[1],
          startX,
          startY,
          pickX,
          pickY,
          boxDelta: {
            x: 0,
            y: 0,
          },
          lastValidBoxDelta: { x: 0, y: 0 },
          isValid: true,
          trashing: false,
        };
        break;
      }
      case "frame-resize": {
        const [startX, startY] = ui.mouseToGridPos(ev.clientX, ev.clientY);
        mouseDown = {
          type: "resizeFrame",
          pos: target[1],
          uuid: target[2],
          startX,
          startY,
          newBox: frames.all[target[2]].value.box,
          lastValidBox: frames.all[target[2]].value.box,
          isValid: true,
        };
        break;
      }
      case "remove-asset": {
        frames.update(target[1], {
          assetUrl: "",
        });
        break;
      }
      case "fit-all": {
        if (fitAllBox) {
          ui.panZoomToFit(fitAllBox);
        }
        break;
      }
      case "toggle-fullscreen": {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          appEl.requestFullscreen();
        }
        break;
      }
    }
  }

  /************************************** */
  // MOUSE MOVE
  /************************************** */

  function handleMouseMove(ev: MouseEvent, target?: ["trash"]) {
    ui.mouse.setXY(ev.clientX, ev.clientY);

    isOnGrid = ev.target === ui.grid.el;

    switch (mouseDown.type) {
      case "pan":
        ui.mouse.pan(ev.movementX, ev.movementY);
        break;
      case "createFrame": {
        // PIN the frame and allow it to expand with cursor movement
        // x & y stay static
        // w & h can get both positive and negative values
        const towardsLeft = ui.mouse.gridX < mouseDown.box.x;
        const towardsUp = ui.mouse.gridY < mouseDown.box.y;
        mouseDown.box = {
          ...mouseDown.box,
          w: ui.mouse.gridX - mouseDown.box.x + (towardsLeft ? -1 : 1),
          h: ui.mouse.gridY - mouseDown.box.y + (towardsUp ? -1 : 1),
        };
        mouseDown.boxNormalized = normalizeBox(mouseDown.box);
        mouseDown.isValid = boxIsValid(mouseDown.boxNormalized);

        const framesTouching = framesInViewportBeingTouched(
          mouseDown.boxNormalized
        ).map((f) => f.uuid);
        mouseDown.touchingFrames = framesTouching;
        break;
      }
      case "moveFrame": {
        const newBoxDelta = {
          x: ui.mouse.gridX - mouseDown.startX,
          y: ui.mouse.gridY - mouseDown.startY,
        };
        mouseDown.boxDelta = newBoxDelta;

        let isValid = true;
        for (let uuid of mouseDown.uuids) {
          const frame = frames.all[uuid].value;

          const newBox = {
            ...frame.box,
            x: frame.box.x + newBoxDelta.x,
            y: frame.box.y + newBoxDelta.y,
          };

          isValid = boxIsValid(newBox, mouseDown.uuids);
          if (!isValid) {
            break;
          }
        }

        mouseDown.isValid = isValid;

        if (mouseDown.isValid) {
          mouseDown.lastValidBoxDelta = newBoxDelta;
        }

        if (target && target[0] === "trash") {
          mouseDown.trashing = true;
        } else {
          mouseDown.trashing = false;
        }

        break;
      }
      case "resizeFrame": {
        const frame = frames.all[mouseDown.uuid].value;
        let deltaX = ui.mouse.gridX - mouseDown.startX;
        let deltaY = ui.mouse.gridY - mouseDown.startY;
        const newBox = resizeBox(mouseDown.pos, frame.box, deltaX, deltaY);
        mouseDown.isValid = boxIsValid(newBox, [mouseDown.uuid]);
        mouseDown.newBox = newBox;
        if (mouseDown.isValid) {
          mouseDown.lastValidBox = newBox;
        }
        break;
      }
      case "painting": {
        const [x, y] = ui.mouseToGridPos(ev.clientX, ev.clientY);
        const points = bresenhamLine(mouseDown.lastX, mouseDown.lastY, x, y);
        points.forEach(([x, y]) => {
          colorPixels.paint(x, y);
        });

        mouseDown.lastX = x;
        mouseDown.lastY = y;
      }
    }
  }

  /************************************** */
  // MOUSE UP
  /************************************** */

  function handleMouseUp() {
    switch (mouseDown.type) {
      case "createFrame": {
        if (mouseDown.isValid) {
          const newFrame: BoxedFrame = {
            box: mouseDown.boxNormalized,
            assetUrl: "",
            split: null,
          };
          frames.create(newFrame);
        } else {
          framesSelected = mouseDown.touchingFrames;
        }
        break;
      }
      case "moveFrame": {
        for (let uuid of mouseDown.uuids) {
          if (mouseDown.trashing) {
            frames.remove(uuid);
          } else {
            const frame = frames.all[uuid].value;
            frames.update(uuid, {
              box: {
                ...frame.box,
                x: frame.box.x + mouseDown.lastValidBoxDelta.x,
                y: frame.box.y + mouseDown.lastValidBoxDelta.y,
              },
            });
          }
        }

        break;
      }
      case "resizeFrame": {
        frames.update(mouseDown.uuid, {
          box: mouseDown.lastValidBox,
        });
        break;
      }
      case "painting": {
        colorPixels.commit();
        break;
      }
      default: {
        console.log("Nothing to do on mouse up for", mouseDown.type);
      }
    }
    mouseDown = { type: "none" };
  }

  /************************************** */
  // MOUSE OVER
  /************************************** */

  function handleMouseOver(ev: MouseEvent, target: string) {
    lastInteractionUuid = target;
  }

  /************************************** */
  // CLICK
  /************************************** */

  async function handleClick(
    ev: MouseEvent,
    target: ["pick-asset", string] | ["set-pallette", number]
  ) {
    switch (target[0]) {
      case "pick-asset":
        const assetData = await assets.pickAsset();
        if (assetData) {
          frames.update(target[1], {
            assetUrl: assetData.key,
          });
        }
        break;
      case "set-pallette":
        colorPixels.setColor(target[1]);
        break;
    }
  }

  /************************************** */
  // WHEEL
  /************************************** */

  function handleWheel(ev: WheelEvent) {
    ev.preventDefault();
    ui.pos.setZoomFromWheel(ev);
  }

  // UTILS

  function boxIsValid(box: Box, excludeUuids: string[] = []) {
    if (box.w * box.h < 4 || box.w < 2 || box.h < 2) return false;
    const testAgainstFrames = framesInViewport.filter(
      (f) => excludeUuids.indexOf(f.uuid) === -1
    );
    return !testAgainstFrames.some((f) => isTouching(f.value.box, box));
  }

  function framesInViewportBeingTouched(box: Box) {
    return framesInViewport.filter((f) => isTouching(f.value.box, box));
  }

  function resolveFrameBox(uuid: string, frame: BoxedFrame): [Box, Box | null] {
    switch (mouseDown.type) {
      case "none":
      case "pan":
      case "createFrame":
      case "painting":
        return [frame.box, null];
      case "moveFrame": {
        if (mouseDown.uuids.indexOf(uuid) !== -1) {
          const resolved = {
            ...frame.box,
            x: frame.box.x + mouseDown.boxDelta.x,
            y: frame.box.y + mouseDown.boxDelta.y,
          };
          if (!mouseDown.isValid) {
            const resolvedValid = {
              ...frame.box,
              x: frame.box.x + mouseDown.lastValidBoxDelta.x,
              y: frame.box.y + mouseDown.lastValidBoxDelta.y,
            };
            return [resolved, resolvedValid];
          } else {
            return [resolved, null];
          }
        } else {
          return [frame.box, null];
        }
      }
      case "resizeFrame": {
        if (mouseDown.uuid === uuid) {
          return [mouseDown.lastValidBox, null];
        } else {
          return [frame.box, null];
        }
      }
    }
  }

  // ██╗███╗   ██╗████████╗███████╗██████╗ ███████╗ █████╗  ██████╗███████╗
  // ██║████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔════╝
  // ██║██╔██╗ ██║   ██║   █████╗  ██████╔╝█████╗  ███████║██║     █████╗
  // ██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██╔══╝  ██╔══██║██║     ██╔══╝
  // ██║██║ ╚████║   ██║   ███████╗██║  ██║██║     ██║  ██║╚██████╗███████╗
  // ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝

  return {
    mountInit,
    ev: {
      click: handleClick,
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
      wheel: handleWheel,
      mouseover: handleMouseOver,
      resetZoom: () => ui.pos.setZoom(1),
    },
    ui,
    boxInPx: ui.grid.boxToPx,
    pos: ui.pos,
    grid: ui.grid,
    mouse: ui.mouse,
    resolveFrameBox,
    get currentAction() {
      return mouseDown;
    },
    get isOnGrid() {
      return isOnGrid;
    },
    currentActionIs(...actionTypes: MouseDownActions["type"][]) {
      return actionTypes.indexOf(mouseDown.type) !== -1;
    },
    get frames() {
      return frames.all;
    },
    get viewportFrames() {
      return framesInViewport;
    },
    get lastInteractionUuid() {
      return lastInteractionUuid;
    },
    get isInFullscreen() {
      return isInFullscreen;
    },
    get spaceColoring() {
      return colorPixels;
    },
    get pixelsInViewport() {
      return colorPixelsInViewport;
    },
    get framesSelected() {
      return framesSelected;
    },
  };
}

let store: Awaited<ReturnType<typeof createStore>>;

export default {
  initialize: async () => {
    store = await createStore();
  },
  get store() {
    return store;
  },
};
