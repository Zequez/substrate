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
import profiles from "./profiles.svelte";
import clients from "../center/clients";
import spaceStore from "./space.svelte";
import keyboardStore from "./keyboard.svelte";
import spaceColoring, {
  filterByBox,
  minBoxForPixels,
  type Pixel,
  type PixelsFlat,
} from "./spaceColoring.svelte";
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

async function createStore() {
  const appEl = document.getElementById("app")!;
  let canvasContainerEl = $state<HTMLDivElement>(null!);

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
      return isTouching(ui.pos.viewport, f.value.box);
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
  const keyboardPan = keyboardStore((x, y) => {
    ui.mouse.pan(x * ui.grid.size * 1.5, y * ui.grid.size * 1.5);
    focusedFrames = [];
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
  let artToolSelectedColor = $state<{
    main: number;
    alt: number;
  }>({ main: 1, alt: 0 });

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

    // $effect(() => {
    //   if (framesByDistance.length) {
    //     focusedFrames = [framesByDistance[0]];
    //   } else {
    //     focusedFrames = [];
    //   }
    // });

    appEl.addEventListener("fullscreenchange", (ev) => {
      isInFullscreen = !!document.fullscreenElement;
    });

    window.addEventListener("keydown", (ev) => {
      if (ev.code === "Backspace" || ev.code === "Delete") {
        if (pixelsSelected.length !== 0) {
          for (let [x, y] of pixelsSelected) {
            colorPixels.paint(x, y, 0);
          }
          colorPixels.commit();
        }
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

      if (ev.code === "Digit1") {
        tool.main = "select";
      } else if (ev.code === "Digit2") {
        tool.main = "frame";
      } else if (ev.code === "Digit3") {
        tool.main = "art";
      } else if (ev.code === "Digit4") {
        tool.main = "lightning";
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
    | { type: "pan"; panned: boolean; timeout: any }
    | {
        type: "selecting";
        box: Box;
        boxNormalized: Box;
        isValid: boolean;
        touchingFrames: string[];
        touchingPixels: PixelsFlat[];
        createFrame: boolean;
        additive: boolean;
      }
    | {
        type: "moveFrame";
        uuids: string[];
        pixels: PixelsFlat[];
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
        color: number;
      };

  let mouseDown = $state<MouseDownActions>({ type: "none" });

  function containerMouseDown(ev: MouseEvent) {
    switch (ev.button) {
      case MAIN_BUTTON:
        handleMouseDown(ev, [tool.main]);
        break;
      case ALT_BUTTON:
        handleMouseDown(ev, [tool.alt]);
        break;
      case WHEEL_BUTTON:
        handleMouseDown(ev, ["hand"]);
        break;
    }
  }

  function handleMouseDown(
    ev: MouseEvent,
    target:
      | ["hand"]
      | ["select"]
      | ["frame"]
      | ["art"]
      | ["lightning"]
      | ["frame-picker", string[] | null]
      | ["frame-resize", BoxResizeHandles, string]
      | ["copy-link", string]
      | ["remove-asset", string]
      | ["fit-all"]
      | ["toggle-fullscreen"]
      | ["expand-frame", string | null]
      | ["pick-selection"]
  ) {
    console.log("Mouse down", target);
    ev.stopPropagation();
    if (mouseDown.type === "pan") {
      clearTimeout(mouseDown.timeout);
    }

    switch (target[0]) {
      case "hand": {
        const timeout = setTimeout(() => {
          if (mouseDown.type === "pan") {
            if (!mouseDown.panned) {
              handleMouseDown(ev, ["select"]);
            }
          }
        }, STATIC_PAN_TO_SELECT_DELAY);

        mouseDown = { type: "pan", panned: false, timeout };
        break;
      }
      case "select": {
        selectedArea = null;
        if (!ev.shiftKey) {
          pixelsSelected = [];
          framesSelected = [];
          focusedFrames = [];
        }
        mouseDown = {
          type: "selecting",
          box: ui.mouse.box,
          boxNormalized: ui.mouse.box,
          isValid: boxIsValid(ui.mouse.box),
          touchingFrames: [],
          touchingPixels: filterByBox(colorPixelsInViewport, ui.mouse.box),
          createFrame: false,
          additive: ev.shiftKey,
        };
        break;
      }
      case "frame": {
        selectedArea = null;
        pixelsSelected = [];
        framesSelected = [];
        mouseDown = {
          type: "selecting",
          box: ui.mouse.box,
          boxNormalized: ui.mouse.box,
          isValid: boxIsValid(ui.mouse.box),
          touchingFrames: [],
          touchingPixels: filterByBox(colorPixelsInViewport, ui.mouse.box),
          createFrame: true,
          additive: false,
        };
        break;
      }
      case "art": {
        const color =
          ev.button === MAIN_BUTTON
            ? artToolSelectedColor.main
            : ev.button === ALT_BUTTON
              ? artToolSelectedColor.alt
              : null;
        if (color !== null) {
          const [x, y] = ui.mouseToGridPos(ev.clientX, ev.clientY);
          mouseDown = {
            type: "painting",
            lastX: x,
            lastY: y,
            color,
          };
          colorPixels.paint(x, y, color);
        }
        break;
      }
      case "lightning": {
        console.log("Lightning rod!");
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
        const t = ev.target as HTMLDivElement;
        const { left, top, width, height } = t.getBoundingClientRect();
        const pickX = (ev.clientX - left) / width;
        const pickY = (ev.clientY - top) / height;

        mouseDown = {
          type: "moveFrame",
          uuids: target[1] ? target[1] : framesSelected,
          pixels: !target[1] ? pixelsSelected : [],
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
      case "expand-frame": {
        expandedFrameUuid = target[1];
        break;
      }
    }
  }

  /************************************** */
  // MOUSE MOVE
  /************************************** */

  function handleMouseMove(ev: MouseEvent, target?: ["trash"]) {
    ui.mouse.setXY(ev.clientX, ev.clientY);

    isOnGrid = ev.target === canvasContainerEl;

    switch (mouseDown.type) {
      case "pan":
        ui.mouse.pan(ev.movementX, ev.movementY);
        if (!mouseDown.panned) {
          mouseDown.panned = true;
          focusedFrames = [];
          focusTabTrail = [];
        }
        break;
      case "selecting": {
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
        const pixelsTouching = filterByBox(
          colorPixelsInViewport,
          mouseDown.boxNormalized
        );
        mouseDown.touchingFrames = framesTouching;
        mouseDown.touchingPixels = pixelsTouching;
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
        const color = mouseDown.color;
        points.forEach(([x, y]) => {
          colorPixels.paint(x, y, color);
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
      case "selecting": {
        if (
          mouseDown.isValid &&
          mouseDown.touchingFrames.length === 0 &&
          mouseDown.touchingPixels.length === 0 &&
          mouseDown.createFrame
        ) {
          const newFrame: BoxedFrame = {
            box: mouseDown.boxNormalized,
            assetUrl: "",
            split: null,
          };
          frames.create(newFrame);
        } else {
          selectedArea =
            mouseDown.touchingPixels.length === 0
              ? null
              : minBoxForPixels(
                  mouseDown.touchingPixels,
                  mouseDown.boxNormalized
                );

          if (mouseDown.additive) {
            for (let uuid of mouseDown.touchingFrames) {
              if (focusedFrames.indexOf(uuid) !== 1) {
                focusedFrames.push(uuid);
              }
            }
            for (let pixel of mouseDown.touchingPixels) {
              if (
                !pixelsSelected.find(
                  ([x, y]) => x === pixel[0] && y === pixel[1]
                )
              ) {
                pixelsSelected.push(pixel);
              }
            }
          } else {
            framesSelected = mouseDown.touchingFrames;
            pixelsSelected = mouseDown.touchingPixels;
            focusedFrames = mouseDown.touchingFrames;
          }
        }
        break;
      }
      case "moveFrame": {
        if (mouseDown.trashing) {
          for (let uuid of mouseDown.uuids) {
            frames.remove(uuid);
          }

          if (pixelsSelected.length) {
            for (let [x, y] of pixelsSelected) {
              colorPixels.paint(x, y, 0);
            }
            colorPixels.commit();
          }

          selectedArea = null;
          framesSelected = [];
          pixelsSelected = [];
        } else {
          for (let uuid of mouseDown.uuids) {
            const frame = frames.all[uuid].value;
            frames.update(uuid, {
              box: {
                ...frame.box,
                x: frame.box.x + mouseDown.lastValidBoxDelta.x,
                y: frame.box.y + mouseDown.lastValidBoxDelta.y,
              },
            });
          }

          if (selectedArea) {
            selectedArea = addDelta(selectedArea, mouseDown.lastValidBoxDelta);
          }

          if (pixelsSelected.length) {
            const { x: dx, y: dy } = mouseDown.lastValidBoxDelta;
            if (!(dx === 0 && dy === 0)) {
              for (let [x, y, color] of pixelsSelected) {
                colorPixels.paint(x, y, 0);
                colorPixels.paint(x + dx, y + dy, color);
              }
              colorPixels.commit();
            }
            pixelsSelected = pixelsSelected.map(([x, y, c]) => [
              x + dx,
              y + dy,
              c,
            ]);
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
    target:
      | ["pick-asset", string]
      | ["set-art-tool-color", "main" | "alt", number]
      | ["set-tool", ToolType]
      | ["set-tool-alt", ToolType]
      | ["focus-frame", UUID]
  ) {
    console.log("CLICK", target);
    switch (target[0]) {
      case "pick-asset":
        const assetData = await assets.pickAsset();
        if (assetData) {
          frames.update(target[1], {
            assetUrl: assetData.key,
          });
        }
        break;
      case "set-art-tool-color":
        if (target[1] === "main") {
          artToolSelectedColor.main = target[2];
        } else {
          artToolSelectedColor.alt = target[2];
        }
        break;
      case "set-tool":
        tool.main = target[1];
        break;
      case "set-tool-alt":
        tool.alt = target[1];
        break;
      case "focus-frame":
        if (ev.shiftKey) {
          if (focusedFrames.indexOf(target[1]) === -1) {
            focusedFrames.push(target[1]);
          }
        } else {
          focusedFrames = [target[1]];
        }
        break;
    }
  }

  async function handleDblClick(ev: MouseEvent, target: ["power-up", string]) {
    switch (target[0]) {
      case "power-up": {
        const hasAsset = frames.all[target[1]].value.assetUrl;
        const i = poweredFrames.indexOf(target[1]);
        if (!hasAsset) {
          handleClick(ev, ["pick-asset", target[1]]);
        }
        if (i === -1) {
          poweredFrames.push(target[1]);
        } else if (hasAsset) {
          const newPoweredFrames = [...poweredFrames];
          newPoweredFrames.splice(i, 1);
          poweredFrames = newPoweredFrames;
        }
        break;
      }
    }
  }

  /************************************** */
  // WHEEL
  /************************************** */

  function handleWheel(ev: WheelEvent) {
    ev.preventDefault();
    ui.pos.setZoomFromWheel(ev, reverseZoomDirection);
  }

  // UTILS

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
    switch (mouseDown.type) {
      case "none":
      case "pan":
      case "selecting":
      case "painting":
        return [frame.box, null];
      case "moveFrame": {
        if (mouseDown.uuids.indexOf(uuid) !== -1) {
          const resolved = addDelta(frame.box, mouseDown.boxDelta);

          if (!mouseDown.isValid) {
            const resolvedValid = addDelta(
              frame.box,
              mouseDown.lastValidBoxDelta
            );

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

  const selecting = $derived(
    mouseDown.type === "selecting" && !mouseDown.createFrame
      ? {
          box: mouseDown.boxNormalized,
        }
      : null
  );
  const creatingFrame = $derived(
    mouseDown.type === "selecting" && mouseDown.createFrame
      ? {
          isValid: mouseDown.isValid,
          box: mouseDown.boxNormalized,
        }
      : null
  );

  const selectedPixelsBox = $derived(
    selectedArea
      ? mouseDown.type === "moveFrame"
        ? addDelta(selectedArea, mouseDown.boxDelta)
        : selectedArea
      : null
  );

  return {
    mountInit,
    get containerEl() {
      return canvasContainerEl;
    },
    set containerEl(v: HTMLDivElement) {
      canvasContainerEl = v;
    },
    get selecting() {
      return selecting;
    },
    get creatingFrame() {
      return creatingFrame;
    },
    get selectedPixelsBox() {
      return selectedPixelsBox;
    },
    ev: {
      containerMouseDown: containerMouseDown,
      click: handleClick,
      dblClick: handleDblClick,
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
    get expandedFrame() {
      return expandedFrameUuid;
    },
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
    get pixelsSelected() {
      return pixelsSelected;
    },
    get selectedArea() {
      return selectedArea;
    },
    get tool() {
      return tool;
    },
    get artToolSelectedColor() {
      return artToolSelectedColor;
    },
    get poweredFrames() {
      return poweredFrames;
    },
    get focusedFrames() {
      return focusedFrames;
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
