import { getContext, onMount, setContext } from "svelte";

import {
  type BoxedFrame,
  type Box,
  normalizeBox,
  resizeBox,
  containingBox,
  isTouching,
  addDelta,
} from "../center/Frame";

// Sub-states
import thingsStore, { type ThingWrapped } from "./things";
import assets from "./assets.svelte";
import clients from "../center/clients";
import spaceStore, { type Viewport } from "./space.svelte";

import spaceColoring, {
  filterByBox,
  minBoxForPixels,
  type Pixel,
  type PixelsFlat,
} from "../pixels-world/spaceColoring.svelte";
import {
  bresenhamLine,
  resolveScreenEdgePanning,
} from "../center/snippets/utils";

type UUID = string;

export type ToolType = "hand" | "select" | "frame" | "art" | "lightning";

export type BoxResizeHandles =
  | "l"
  | "r"
  | "b"
  | "t"
  | "tr"
  | "br"
  | "tl"
  | "bl";

export type BoxedFrameWrapped = ThingWrapped<"BoxedFrame", BoxedFrame>;

export const WHEEL_BUTTON = 1;
export const MAIN_BUTTON = 0;
export const ALT_BUTTON = 2;
export const STATIC_PAN_TO_SELECT_DELAY = 399000;

type StoreConfig = {
  depth: number;
};

function createStore(storeConfig: StoreConfig) {
  const appEl = document.getElementById("app")!;
  // let canvasContainerEl = $state<HTMLDivElement>(null!);

  // Frame stuff
  let frames = $state(
    thingsStore.typeOfThing<"BoxedFrame", BoxedFrame>(
      "BoxedFrame",
      "BOXED_FRAME"
    )
  );

  const frameHash = clients.wal ? clients.wal.hrl[1] : null;
  const frame = frameHash ? frames.findByHash(frameHash) : null;
  let framesSelected = $state<UUID[]>([]);
  let pixelsSelected = $state<PixelsFlat[]>([]);
  let selectedArea = $state<Box | null>(null);
  let expandedFrameUuid = $state<UUID | null>(null);
  let reverseZoomDirection = $state<boolean>(false);
  let focusedFrames = $state<UUID[]>([]);
  let focusTabTrail = $state<UUID[]>([]);
  let poweredFrames = $state<UUID[]>([]);
  // let focusState = $state<{
  //   visible: boolean;
  //   focusedUuids: UUID[];
  //   focusTabTrail: UUID[];
  // }>();

  let tool = $state<{ main: ToolType; alt: ToolType }>({
    main: "select",
    alt: "art",
  });

  const fitAllBox = $derived(
    containingBox(frames.allFlat.map((f) => f.value.box))
  );
  const framesInViewport = $derived.by(() => {
    return frames.allFlat.filter((f) => {
      return isTouching(ui.vpBox, f.value.box);
    });
  });
  const closestFrame = (cx: number, cy: number, skip: UUID[]): UUID | null => {
    const framesToCheck = framesInViewport.filter(
      (f) => skip.indexOf(f.uuid) === -1
    );
    if (framesToCheck.length === 0) return null;
    const framesCenters: [UUID, number, number][] = framesToCheck.map((f) => [
      f.uuid,
      f.value.box.x + f.value.box.w / 2,
      f.value.box.y + f.value.box.h / 2,
    ]);
    const distanceToFrames: [UUID, number][] = framesCenters.map(
      ([uuid, x, y]) => {
        const dx = cx - x;
        const dy = cy - y;
        return [uuid, dx * dx + dy * dy];
      }
    );
    const framesSortedByClosest = distanceToFrames.sort(
      ([uuid1, d1], [uuid2, d2]) => {
        return d1 - d2;
      }
    );
    return framesSortedByClosest[0][0];
  };
  // const framesByDistance = $derived.by(() => {
  //   console.log(ui.pos.x, ui.pos.y);
  //   const cx = ui.pos.x;
  //   const cy = ui.pos.y;
  //   return framesInViewport
  //     .sort((a, b) => {
  //       const dx = a.value.box.x + a.value.box.w / 2 - cx;
  //       const dy = a.value.box.y + a.value.box.h / 2 - cy;
  //       const adx = b.value.box.x + b.value.box.w / 2 - cx;
  //       const ady = b.value.box.y + b.value.box.h / 2 - cy;
  //       return adx * adx - ady * ady - dx * dx + dy * dy;
  //     })
  //     .map((f) => f.uuid);
  // });
  // const otherFramesByDistance = $derived.by<{[key: UUID]: }>(() => {

  // })
  let lastInteractionUuid = $state<string | null>(null);

  // Space stuff
  let isInFullscreen = $state<boolean>(!!document.fullscreenElement);
  const ui = spaceStore({ centerAt: frame ? frame.value.box : null });
  let isOnGrid = $state(false);

  // ██╗███╗   ██╗██╗████████╗
  // ██║████╗  ██║██║╚══██╔══╝
  // ██║██╔██╗ ██║██║   ██║
  // ██║██║╚██╗██║██║   ██║
  // ██║██║ ╚████║██║   ██║
  // ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝

  $effect(() => {
    if (fitAllBox) {
      ui.cmd.setMinZoomToFitBox(fitAllBox);
    }
  });

  // $effect(() => {
  //   if (framesByDistance.length) {
  //     focusedFrames = [framesByDistance[0]];
  //   } else {
  //     focusedFrames = [];
  //   }
  // });

  onMount(() => {
    appEl.addEventListener("fullscreenchange", (ev) => {
      isInFullscreen = !!document.fullscreenElement;
    });

    window.addEventListener("keydown", (ev) => {
      if (ev.code === "Backspace" || ev.code === "Delete") {
        // if (pixelsSelected.length !== 0) {
        //   for (let [x, y] of pixelsSelected) {
        //     colorPixels.paint(x, y, 0);
        //   }
        //   colorPixels.commit();
        // }
        if (framesSelected.length !== 0) {
          for (let uuid of framesSelected) {
            frames.remove(uuid);
          }
        }
        pixelsSelected = [];
        framesSelected = [];
        selectedArea = null;
      }

      if (ev.code === "Escape" && selectedArea !== null) {
        pixelsSelected = [];
        framesSelected = [];
        selectedArea = null;
      }

      if (ev.code === "Escape" && focusedFrames.length !== 0) {
        focusedFrames = [];
      }

      if (ev.code === "Tab") {
        ev.preventDefault();

        if (ev.shiftKey) {
          if (focusedFrames.length === 0) {
            focusedFrames = [...framesInViewport.map((f) => f.uuid)];
          } else {
            const lastFocused = focusedFrames[focusedFrames.length - 1];
            const box = frames.all[lastFocused].value.box;
            const cx = box.x + box.w / 2;
            const cy = box.y + box.h / 2;
            const closest = closestFrame(cx, cy, focusedFrames);
            if (closest) {
              focusedFrames.push(closest);
            }
          }
        } else {
          if (focusedFrames.length === 0) {
            const closest = closestFrame(ui.pos.x, ui.pos.y, []);
            console.log("CLOSEST!", closest);
            if (closest) {
              focusedFrames = [closest];
              focusTabTrail.push(closest);
            }
          } else {
            const last = focusTabTrail[focusTabTrail.length - 1];
            const box = frames.all[last].value.box;
            const cx = box.x + box.w / 2;
            const cy = box.y + box.h / 2;
            const closest = closestFrame(cx, cy, focusTabTrail);
            if (closest) {
              focusedFrames = [closest];
              focusTabTrail.push(closest);
            } else {
              focusedFrames = [focusTabTrail[0]];
              focusTabTrail = [focusTabTrail[0]];
            }
          }
        }
      }

      if (ev.code === "KeyZ" && ev.shiftKey) {
        reverseZoomDirection = !reverseZoomDirection;
      }

      if (ev.code === "Space") {
        let concerningFrames = focusedFrames;
        if (focusedFrames.length === 0) {
          const closest = closestFrame(ui.pos.x, ui.pos.y, []);
          if (!closest) return;
          concerningFrames = [closest];
        }

        const unpowered = concerningFrames.filter(
          (uuid) => poweredFrames.indexOf(uuid) === -1
        );
        if (unpowered.length !== 0) {
          // Power them all up
          for (let uuid of unpowered) {
            poweredFrames.push(uuid);
          }
        } else {
          // Power them all down
          poweredFrames = poweredFrames.filter(
            (uuid) => concerningFrames.indexOf(uuid) === -1
          );
        }

        // if (focusedFrames.length === 1) {
        //   if (poweredFrames.includes(focusedFrames[0])) {
        //     poweredFrames = poweredFrames.filter((f) => f !== focusedFrames[0]);
        //   } else {
        //     poweredFrames.push(focusedFrames[0]);
        //   }
        // }
      }
    });
  });

  let timeoutId: any = null;
  const panSize = (ui.grid.size * 2) / 1.5;
  const edge = 10;
  function processFullscreenEdgePanning() {
    const [panX, panY] = resolveScreenEdgePanning(
      edge,
      ui.mouse.clientX,
      ui.mouse.clientY,
      ui.vp.width,
      ui.vp.height
    );
    if (panX || panY) {
      ui.cmd.pan(panX * panSize, panY * panSize);
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

  //  █████╗  ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
  // ██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
  // ███████║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
  // ██╔══██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
  // ██║  ██║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
  // ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝

  type DragState =
    | { type: "none" }
    | { type: "panning"; panned: boolean }
    | {
        type: "selecting";
        box: Box;
        boxNormalized: Box;
        touchingFrames: string[];
        // touchingPixels: PixelsFlat[];
        additive: boolean;
      }
    | {
        type: "creatingFrame";
        box: Box;
        boxNormalized: Box;
        isValid: boolean;
      }
    | {
        type: "movingFrames";
        startX: number;
        startY: number;
        boxDelta: { x: number; y: number };
        trashing: boolean;
        pickX: number;
        pickY: number;
        lastValidBoxDelta: { x: number; y: number };
        isValid: boolean;
        moved: boolean;
      }
    | {
        type: "resizingFrame";
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
        color: number;
      };

  let dragState = $state<DragState>({ type: "none" });

  function containerMouseDown(ev: MouseEvent) {
    switch (ev.button) {
      case MAIN_BUTTON:
        handleMouseDown(ev, ["container", tool.main]);
        break;
      case ALT_BUTTON:
        handleMouseDown(ev, ["container", tool.alt]);
        break;
      case WHEEL_BUTTON:
        handleMouseDown(ev, ["container", "hand"]);
        break;
    }
  }

  async function handleMouseDown(
    ev: MouseEvent,
    source:
      | ["container", ToolType]
      | ["frame", UUID, "drag-handle"]
      | ["frame", UUID, "resize-handle", BoxResizeHandles]
  ) {
    console.log("Mouse down", source);
    ev.stopPropagation();

    switch (source[0]) {
      case "container":
        switch (source[1]) {
          case "hand": {
            dragState = { type: "panning", panned: false };
            break;
          }
          case "select": {
            selectedArea = null;
            if (!ev.shiftKey) {
              pixelsSelected = [];
              framesSelected = [];
              focusedFrames = [];
            }
            dragState = {
              type: "selecting",
              box: ui.mouse.box,
              boxNormalized: ui.mouse.box,
              touchingFrames: [],
              // touchingPixels: filterByBox(colorPixelsInViewport, ui.mouse.box),
              additive: ev.shiftKey,
            };
            break;
          }
          case "frame": {
            selectedArea = null;
            pixelsSelected = [];
            framesSelected = [];
            dragState = {
              type: "creatingFrame",
              box: ui.mouse.box,
              boxNormalized: ui.mouse.box,
              isValid: boxIsValid(ui.mouse.box),
            };
            break;
          }
          // case "art": {
          //   const color =
          //     ev.button === MAIN_BUTTON
          //       ? artToolSelectedColor.main
          //       : ev.button === ALT_BUTTON
          //         ? artToolSelectedColor.alt
          //         : null;
          //   if (color !== null) {
          //     const [x, y] = ui.mouseToGridPos(ev.clientX, ev.clientY);
          //     dragState = {
          //       type: "painting",
          //       lastX: x,
          //       lastY: y,
          //       color,
          //     };
          //     colorPixels.paint(x, y, color);
          //   }
          //   break;
          // }
          // case "lightning": {
          //   console.log("Lightning rod!");
          //   break;
          // }
        }
        break;
      case "frame": {
        const uuid = source[1];
        switch (source[2]) {
          case "drag-handle": {
            const [startX, startY] = ui.mouseToGridPos(ev.clientX, ev.clientY);
            const t = ev.target as HTMLDivElement;
            const { left, top, width, height } = t.getBoundingClientRect();
            const pickX = (ev.clientX - left) / width;
            const pickY = (ev.clientY - top) / height;

            if (framesSelected.indexOf(uuid) === -1) {
              if (ev.shiftKey) {
                framesSelected.push(uuid);
              } else {
                framesSelected = [uuid];
              }
            }

            dragState = {
              type: "movingFrames",
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
              moved: false,
            };
            break;
          }
          case "resize-handle": {
            const [startX, startY] = ui.mouseToGridPos(ev.clientX, ev.clientY);
            dragState = {
              type: "resizingFrame",
              pos: source[3],
              uuid: uuid,
              startX,
              startY,
              newBox: frames.all[uuid].value.box,
              lastValidBox: frames.all[uuid].value.box,
              isValid: true,
            };
            break;
          }
        }
        break;
      }
    }
  }

  /************************************** */
  // MOUSE MOVE
  /************************************** */

  function handleMouseMove(ev: MouseEvent, source: "container" | "trash") {
    ui.cmd.setMouseXY(ev.clientX, ev.clientY);

    isOnGrid = source[0] === "container";

    switch (dragState.type) {
      case "panning":
        ui.cmd.pan(ev.movementX, ev.movementY);
        if (!dragState.panned) {
          dragState.panned = true;
          focusedFrames = [];
          focusTabTrail = [];
        }
        break;
      case "selecting":
      case "creatingFrame": {
        // PIN the frame and allow it to expand with cursor movement
        // x & y stay static
        // w & h can get both positive and negative values
        const towardsLeft = ui.mouse.gridX < dragState.box.x;
        const towardsUp = ui.mouse.gridY < dragState.box.y;
        dragState.box = {
          ...dragState.box,
          w: ui.mouse.gridX - dragState.box.x + (towardsLeft ? -1 : 1),
          h: ui.mouse.gridY - dragState.box.y + (towardsUp ? -1 : 1),
        };
        dragState.boxNormalized = normalizeBox(dragState.box);
        if (dragState.type === "selecting") {
          const framesTouching = framesInViewportBeingTouched(
            dragState.boxNormalized
          ).map((f) => f.uuid);
          // const pixelsTouching = filterByBox(
          //   colorPixelsInViewport,
          //   dragState.boxNormalized
          // );
          dragState.touchingFrames = framesTouching;
          // dragState.touchingPixels = pixelsTouching;
        } else {
          dragState.isValid = boxIsValid(dragState.boxNormalized);
        }
        break;
      }
      case "movingFrames": {
        const newBoxDelta = {
          x: ui.mouse.gridX - dragState.startX,
          y: ui.mouse.gridY - dragState.startY,
        };
        dragState.boxDelta = newBoxDelta;

        let isValid = true;
        for (let uuid of framesSelected) {
          const frame = frames.all[uuid].value;

          const newBox = {
            ...frame.box,
            x: frame.box.x + newBoxDelta.x,
            y: frame.box.y + newBoxDelta.y,
          };

          isValid = boxIsValid(newBox, framesSelected);
          if (!isValid) {
            break;
          }
        }

        dragState.isValid = isValid;
        dragState.moved = true;

        if (dragState.isValid) {
          dragState.lastValidBoxDelta = newBoxDelta;
        }

        if (source === "trash") {
          dragState.trashing = true;
        } else {
          dragState.trashing = false;
        }

        break;
      }
      case "resizingFrame": {
        const frame = frames.all[dragState.uuid].value;
        let deltaX = ui.mouse.gridX - dragState.startX;
        let deltaY = ui.mouse.gridY - dragState.startY;
        const newBox = resizeBox(dragState.pos, frame.box, deltaX, deltaY);
        dragState.isValid = boxIsValid(newBox, [dragState.uuid]);
        dragState.newBox = newBox;
        if (dragState.isValid) {
          dragState.lastValidBox = newBox;
        }
        break;
      }
      // case "painting": {
      //   const [x, y] = ui.mouseToGridPos(ev.clientX, ev.clientY);
      //   const points = bresenhamLine(dragState.lastX, dragState.lastY, x, y);
      //   const color = dragState.color;
      //   points.forEach(([x, y]) => {
      //     colorPixels.paint(x, y, color);
      //   });

      //   dragState.lastX = x;
      //   dragState.lastY = y;
      // }
    }
  }

  /************************************** */
  // MOUSE UP
  /************************************** */

  function handleMouseUp(ev: MouseEvent, source: "container" | "trash") {
    switch (dragState.type) {
      case "selecting": {
        if (dragState.additive) {
          for (let uuid of dragState.touchingFrames) {
            if (framesSelected.indexOf(uuid) !== 1) {
              framesSelected.push(uuid);
            }
          }
        } else {
          framesSelected = dragState.touchingFrames;
        }
        break;
      }
      case "creatingFrame": {
        if (dragState.isValid) {
          const newFrame: BoxedFrame = {
            box: dragState.boxNormalized,
            assetUrl: "",
            split: null,
          };
          frames.create(newFrame);
        }
        break;
      }
      case "movingFrames": {
        if (dragState.trashing) {
          for (let uuid of framesSelected) {
            frames.remove(uuid);
          }
          framesSelected = [];
          break;
          // pixelsSelected = [];
        } else {
          for (let uuid of framesSelected) {
            const frame = frames.all[uuid].value;
            frames.update(uuid, {
              box: {
                ...frame.box,
                x: frame.box.x + dragState.lastValidBoxDelta.x,
                y: frame.box.y + dragState.lastValidBoxDelta.y,
              },
            });
          }
        }
        break;
      }
      case "resizingFrame": {
        frames.update(dragState.uuid, {
          box: dragState.lastValidBox,
        });
        break;
      }
      default: {
        console.log("Nothing to do on mouse up for", dragState.type);
      }
    }
    dragState = { type: "none" };
  }

  function handleMouseOver(ev: MouseEvent, source: ["frame", UUID]) {
    if (source[0] === "frame") {
      lastInteractionUuid = source[1];
    }
  }

  function handleWheel(ev: WheelEvent, source: ["container"]) {
    ev.preventDefault();
    ev.stopPropagation();

    if (source[0] === "container") {
      ui.cmd.setZoomFromWheel(ev.deltaY * (reverseZoomDirection ? -1 : 1));
    }
  }

  type Direction = number;
  type Distance = number;

  type Command =
    | ["move-towards", Direction, Distance]
    | ["move-towards-xy", Distance, Distance]
    | ["set-tool-to", ToolType, "main" | "alt"]
    | ["fit-all"]
    | ["exit-expanded-frame"]
    | ["toggle-fullscreen"]
    | ["reset-zoom"]
    | ["frame", UUID, "add-to-selection"]
    | ["frame", UUID, "copy-link"]
    | ["frame", UUID, "pick-asset"]
    | ["frame", UUID, "remove-asset"]
    | ["frame", UUID, "expand"]
    | ["frame", UUID, "remove"]
    | ["set-viewport", Viewport]
    | ["center"];

  function processCommands(...cmd: Command) {
    switch (cmd[0]) {
      case "move-towards":
        {
          const [, direction, distance] = cmd;

          if (distance) {
            const piDirection = (direction + 0.25) * 2 * Math.PI;
            const xRatio = Math.cos(piDirection);
            const yRatio = Math.sin(piDirection);

            ui.cmd.pan(xRatio * distance, yRatio * distance);
          }
        }
        break;
      case "move-towards-xy":
        const [, dx, dy] = cmd;
        ui.cmd.pan(dx, dx);
        break;
      case "set-tool-to": {
        const [, toolType, boundTo] = cmd;
        tool[boundTo] = toolType;
        break;
      }
      case "fit-all": {
        if (fitAllBox) {
          ui.cmd.panZoomToFit(fitAllBox);
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
      case "exit-expanded-frame": {
        expandedFrameUuid = null;
        break;
      }
      case "reset-zoom": {
        ui.cmd.setZoom(1);
        break;
      }
      case "set-viewport": {
        ui.cmd.setViewport(cmd[1]);
        break;
      }
      case "center": {
        ui.cmd.panTo(0, 0);
        break;
      }
      case "frame": {
        const uuid = cmd[1];
        switch (cmd[2]) {
          case "add-to-selection": {
            const i = framesSelected.indexOf(uuid);
            if (i === -1) {
              framesSelected.push(uuid);
            } else {
              framesSelected = [
                // Splice doesn't trigger signal updates I think
                ...framesSelected.slice(0, i),
                ...framesSelected.slice(i + 1),
              ];
            }
            break;
          }
          case "copy-link": {
            const [wal, url] = frames.link(uuid);
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
          case "pick-asset": {
            assets.pickAsset().then((assetData) => {
              if (assetData) {
                frames.update(uuid, {
                  assetUrl: assetData.key,
                });
              }
            });
            break;
          }
          case "remove-asset": {
            frames.update(uuid, {
              assetUrl: "",
            });
            break;
          }
          case "expand": {
            expandedFrameUuid = uuid;
            break;
          }
        }
      }
    }
  }

  // ██╗   ██╗████████╗██╗██╗     ███████╗
  // ██║   ██║╚══██╔══╝██║██║     ██╔════╝
  // ██║   ██║   ██║   ██║██║     ███████╗
  // ██║   ██║   ██║   ██║██║     ╚════██║
  // ╚██████╔╝   ██║   ██║███████╗███████║
  //  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝

  function boxIsValid(box: Box, excludeUuids: string[] = []) {
    if (box.w < 4 || box.h < 4) return false;
    const testAgainstFrames = framesInViewport.filter(
      (f) => excludeUuids.indexOf(f.uuid) === -1
    );
    return !testAgainstFrames.some((f) => isTouching(f.value.box, box));
  }

  function framesInViewportBeingTouched(box: Box) {
    return framesInViewport.filter((f) => isTouching(f.value.box, box));
  }

  function resolveFrameBox(uuid: string, frame: BoxedFrame): [Box, Box | null] {
    switch (dragState.type) {
      case "none":
      case "panning":
      case "selecting":
        return [frame.box, null];
      case "movingFrames": {
        if (framesSelected.indexOf(uuid) !== -1) {
          const resolved = addDelta(frame.box, dragState.boxDelta);

          if (!dragState.isValid) {
            const resolvedValid = addDelta(
              frame.box,
              dragState.lastValidBoxDelta
            );

            return [resolved, resolvedValid];
          } else {
            return [resolved, null];
          }
        } else {
          return [frame.box, null];
        }
      }
      case "resizingFrame": {
        if (dragState.uuid === uuid) {
          return [dragState.lastValidBox, null];
        } else {
          return [frame.box, null];
        }
      }
    }
    return [frame.box, null];
  }

  //  ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗ ███╗   ██╗██████╗ ███████╗
  // ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝
  // ██║     ██║   ██║██╔████╔██║██╔████╔██║███████║██╔██╗ ██║██║  ██║███████╗
  // ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║╚════██║
  // ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝███████║
  //  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝

  return {
    get dragState() {
      return dragState;
    },
    cmd: processCommands,
    ev: {
      containerMouseDown: containerMouseDown,
      mousedown:
        (...c: Parameters<typeof handleMouseDown>[1]) =>
        (ev: MouseEvent) =>
          handleMouseDown(ev, c),
      mousemove:
        (c: Parameters<typeof handleMouseMove>[1]) => (ev: MouseEvent) =>
          handleMouseMove(ev, c),
      mouseup: (c: Parameters<typeof handleMouseUp>[1]) => (ev: MouseEvent) =>
        handleMouseUp(ev, c),
      wheel:
        (...c: Parameters<typeof handleWheel>[1]) =>
        (ev: WheelEvent) =>
          handleWheel(ev, c),
      mouseover:
        (...c: Parameters<typeof handleMouseOver>[1]) =>
        (ev: MouseEvent) =>
          handleMouseOver(ev, c),
      cmd: processCommands,
    },
    ui,
    boxInPx: ui.grid.boxToPx,
    pos: ui.pos,
    get vp() {
      return ui.vp;
    },
    grid: ui.grid,
    mouse: ui.mouse,
    resolveFrameBox,
    get expandedFrame() {
      return expandedFrameUuid;
    },
    get isOnGrid() {
      return isOnGrid;
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
    // get spaceColoring() {
    //   return colorPixels;
    // },
    // get pixelsInViewport() {
    //   return colorPixelsInViewport;
    // },
    get framesSelected() {
      return framesSelected;
    },
    get pixelsSelected() {
      return pixelsSelected;
    },
    get selectedArea() {
      return selectedArea;
    },
    get tool() {
      return tool;
    },
    // get artToolSelectedColor() {
    //   return artToolSelectedColor;
    // },
    get poweredFrames() {
      return poweredFrames;
    },
    get focusedFrames() {
      return focusedFrames;
    },
    storeConfig,
  };
}

export default {
  createStoreContext: (storeConfig: StoreConfig) => {
    const store = createStore(storeConfig);
    setContext("main-store", store);
  },
  get store() {
    return getContext("main-store") as ReturnType<typeof createStore>;
  },
};
