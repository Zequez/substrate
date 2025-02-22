import thingsStore from "./things";
import { type Box } from "../center/Frame";

export const PALLETTE = [
  null,
  "#111111",
  "hsl(90, 70%, 50%)",
  "hsl(120, 70%, 50%)",
  "hsl(150, 70%, 50%)",
  "hsl(180, 70%, 50%)",
  "hsl(210, 70%, 50%)",
  "hsl(240, 70%, 50%)",
  "hsl(270, 70%, 50%)",
  "hsl(300, 70%, 50%)",
  "hsl(330, 70%, 50%)",
  "hsl(340, 70%, 50%)",
  "hsl(0, 70%, 50%)",
  "hsl(30, 70%, 50%)",
  "hsl(60, 90%, 50%)",
  "#fafafa",
];

// x, y, color
export type PixelsFlat = [number, number, number];
export type Pixel = [number, number];

type PixelsMapTimestamped = {
  [key: string]: [number, number];
};

export function encodeXY(x: number, y: number) {
  return `${x},${y}`;
}

export function decodeXY(xy: string): [number, number] {
  const [x, y] = xy.split(",");
  return [Number(x), Number(y)];
}

export function isWithinBox(x: number, y: number, box: Box) {
  return (
    x >= box.x && x <= box.x + box.w - 1 && y >= box.y && y <= box.y + box.h - 1
  );
}

// returns the smallest box that contains all pixels
export function minBoxForPixels(pixels: PixelsFlat[], box: Box): Box {
  return {
    x: Math.min(...pixels.map((p) => p[0])),
    y: Math.min(...pixels.map((p) => p[1])),
    w:
      Math.max(...pixels.map((p) => p[0])) -
      Math.min(...pixels.map((p) => p[0])) +
      1,
    h:
      Math.max(...pixels.map((p) => p[1])) -
      Math.min(...pixels.map((p) => p[1])) +
      1,
  };
}

export function filterByBox(pixels: PixelsFlat[], box: Box): PixelsFlat[] {
  return pixels.filter((p) => isWithinBox(p[0], p[1], box));
}

export function addDelta(
  pixels: PixelsFlat[],
  delta: { x: number; y: number }
): PixelsFlat[] {
  return pixels.map((p) => [p[0] + delta.x, p[1] + delta.y, p[2]]);
}

export function removePixels(
  pixels: PixelsFlat[],
  pixelsToRemove: PixelsFlat[]
) {
  return pixels.filter((p) => {
    return !pixelsToRemove.some((p2) => p[0] === p2[0] && p[1] === p2[1]);
  });
}

export function addPixels(pixels: PixelsFlat[], pixelsToAdd: PixelsFlat[]) {
  return removePixels(pixels, pixelsToAdd).concat(pixelsToAdd);
}

function createStore() {
  const pixels = $state(
    thingsStore.typeOfThing<"AgentColorPixels", PixelsMapTimestamped>(
      "AgentColorPixels",
      "AGENT_COLOR_PIXELS",
      true
    )
  );

  let buffer = $state<PixelsMapTimestamped>({});
  let bufferFlat = $derived(toFlat(buffer));

  const pixelsFlat = $derived.by<PixelsFlat[]>(() => {
    const latest = Object.values(pixels.all).reduce(
      (all, { value: pixels }) => {
        Object.entries(pixels).forEach(([xy, [color, timestamp]]) => {
          if (!all[xy]) {
            all[xy] = [color, timestamp];
          } else if (timestamp > all[xy][1]) {
            all[xy] = [color, timestamp];
          }
        });
        return all;
      },
      {} as PixelsMapTimestamped
    );
    return toFlat(latest).filter((p) => p[2] !== 0);
  });

  function toFlat(pxls: PixelsMapTimestamped): PixelsFlat[] {
    return Object.entries(pxls).map(([k, v]) => [...decodeXY(k), v[0]]);
  }

  function paint(x: number, y: number, color: number) {
    const xy = encodeXY(x, y);
    buffer[xy] = [color, Date.now()];
  }

  async function commit() {
    if (pixels.mine) {
      const stored = pixels.mine.value;
      const changed = Object.entries(buffer).some(([xy, color]) => {
        return !stored[xy] || stored[xy] !== color;
      });
      if (changed) {
        const newPixels: PixelsMapTimestamped = {
          ...pixels.mine.value,
          ...buffer,
        };
        await pixels.update(null, newPixels);
      }
    } else {
      const newPixels: PixelsMapTimestamped = buffer;
      await pixels.create(newPixels);
    }
    buffer = {};
  }

  return {
    get pixels() {
      return pixelsFlat;
    },
    get buffer() {
      return bufferFlat;
    },
    paint,
    commit,
  };
}

export default {
  createStore,
  encodeXY,
  decodeXY,
  PALLETTE,
};
