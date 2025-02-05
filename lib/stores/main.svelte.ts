import { onMount } from "svelte";
import {
  type BoxedFrame,
  type Box,
  normalizeBox,
  resizeBox,
  containingBox,
  isTouching,
} from "../Frame";
import { renderGrid } from "../grid";

// Sub-states
import thingsStore from "./things";
import assets from "./assets.svelte";
import profiles from "./profiles.svelte";
import clients from "../clients";
import uiStore from "./ui.svelte";

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
  type FramesStore = ReturnType<
    typeof thingsStore.typeOfThing<"BoxedFrame", BoxedFrame>
  >;

  let frames = $state<FramesStore>(
    thingsStore.typeOfThing<"BoxedFrame", BoxedFrame>(
      "BoxedFrame",
      "BOXED_FRAME"
    )
  );

  const frameHash = clients.wal ? clients.wal.hrl[1] : null;
  const frame = frameHash ? frames.findByHash(frameHash) : null;
  const fitAllBox = $derived(
    containingBox(Object.values(frames.all).map((f) => f.value.box))
  );
  const framesInViewport: string[] = $derived.by(() => {
    return Object.values(frames.all)
      .filter((f) => {
        return isTouching(ui.pos.viewport, f.value.box);
      })
      .map((f) => f.uuid);
  });

  const ui = uiStore({ centerAt: frame ? frame.value.box : null });

  // ██╗███╗   ██╗██╗████████╗
  // ██║████╗  ██║██║╚══██╔══╝
  // ██║██╔██╗ ██║██║   ██║
  // ██║██║╚██╗██║██║   ██║
  // ██║██║ ╚████║██║   ██║
  // ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝

  function mountInit() {
    profiles.mountInit();
    ui.mountInit();

    $effect(() => {
      ui.setMinZoomToFitBox(fitAllBox);
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
    | { type: "createFrame"; box: Box; boxNormalized: Box }
    | {
        type: "moveFrame";
        uuid: string;
        startX: number;
        startY: number;
        boxDelta: { x: number; y: number };
        trashing: boolean;
        pickX: number;
        pickY: number;
      }
    | {
        type: "resizeFrame";
        pos: BoxResizeHandles;
        uuid: string;
        startX: number;
        startY: number;
        newBox: Box;
      };

  let mouseDown = $state<MouseDownActions>({ type: "none" });

  function handleMouseDown(
    ev: MouseEvent,
    target?:
      | ["frame-picker", string]
      | ["frame-resize", BoxResizeHandles, string]
      | ["copy-link", string]
      | ["remove-asset", string]
      | ["fit-all"]
  ) {
    // console.log("Mouse down", target);
    if (target) {
      ev.stopPropagation();
      switch (target[0]) {
        case "copy-link": {
          console.log("COPYING LINK FOR ", target[1]);
          // Copy to clipboard
          const [wal, url] = frames.link(target[1]);
          if (url && wal) {
            navigator.clipboard.writeText(url);
            clients.weave.assets.assetToPocket(wal);
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
            uuid: target[1],
            startX,
            startY,
            pickX,
            pickY,
            boxDelta: {
              x: 0,
              y: 0,
            },
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
          ui.panZoomToFit(fitAllBox);
        }
      }
    } else {
      if (ev.button === 1) {
        mouseDown = { type: "pan" };
      } else if (ev.button === 0) {
        mouseDown = {
          type: "createFrame",
          box: ui.mouse.box,
          boxNormalized: ui.mouse.box,
        };
      }
    }
  }

  /************************************** */
  // MOUSE MOVE
  /************************************** */

  function handleMouseMove(ev: MouseEvent, target?: ["trash"]) {
    // console.log("Mouse move, target: ", target);
    ui.mouse.setXY(ev.clientX, ev.clientY);

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
        break;
      }
      case "moveFrame": {
        const boxDelta = {
          x: ui.mouse.gridX - mouseDown.startX,
          y: ui.mouse.gridY - mouseDown.startY,
        };
        mouseDown.boxDelta.x = boxDelta.x;
        mouseDown.boxDelta.y = boxDelta.y;

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
        mouseDown.newBox = resizeBox(mouseDown.pos, frame.box, deltaX, deltaY);
      }
    }
  }

  /************************************** */
  // MOUSE UP
  /************************************** */

  function handleMouseUp() {
    switch (mouseDown.type) {
      case "createFrame": {
        if (mouseDown.boxNormalized.w * mouseDown.boxNormalized.h >= 4) {
          const newFrame: BoxedFrame = {
            box: mouseDown.boxNormalized,
            assetUrl: "",
            split: null,
          };
          console.log("NEW FRAME!", newFrame.box);
          frames.create(newFrame);
        }
        break;
      }
      case "moveFrame": {
        if (mouseDown.trashing) {
          frames.remove(mouseDown.uuid);
        } else {
          const frame = frames.all[mouseDown.uuid].value;
          frames.update(mouseDown.uuid, {
            box: {
              ...frame.box,
              x: frame.box.x + mouseDown.boxDelta.x,
              y: frame.box.y + mouseDown.boxDelta.y,
            },
          });
        }
        break;
      }
      case "resizeFrame": {
        frames.update(mouseDown.uuid, {
          box: mouseDown.newBox,
        });
        break;
      }
      default: {
        console.log("Nothing to do on mouse up for", mouseDown.type);
      }
    }
    mouseDown = { type: "none" };
  }

  /************************************** */
  // CLICK
  /************************************** */

  async function handleClick(ev: MouseEvent, target?: ["pick-asset", string]) {
    if (target) {
      if (target[0] === "pick-asset") {
        const assetData = await assets.pickAsset();
        if (assetData) {
          frames.update(target[1], {
            assetUrl: assetData.key,
          });
        }
      }
    }
  }

  /************************************** */
  // WHEEL
  /************************************** */

  function handleWheel(ev: WheelEvent) {
    ev.preventDefault();
    ui.pos.setZoomFromWheel(ev);
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
      resetZoom: () => ui.pos.setZoom(1),
    },
    ui,
    boxInPx: ui.grid.boxToPx,
    pos: ui.pos,
    grid: ui.grid,
    mouse: ui.mouse,
    get currentAction() {
      return mouseDown;
    },
    currentActionIs(...actionTypes: MouseDownActions["type"][]) {
      return actionTypes.indexOf(mouseDown.type) !== -1;
    },
    get frames() {
      return frames.all;
    },
    frameIsInViewport(uuid: string): boolean {
      // return true;
      return framesInViewport.indexOf(uuid) !== -1;
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
