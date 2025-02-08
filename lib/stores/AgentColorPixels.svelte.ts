import clients from "../../lib/clients";
import thingsStore from "./things";

export const PALLETTE = [
  null,
  "#ffffff",
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
];

// x, y, color
export type PixelsFlat = [number, number, number];

type PixelsMapTimestamped = {
  [key: string]: [number, number];
};

export function encodeXY(x: number, y: number) {
  return `${x},${y}`;
}

function decodeXY(xy: string): [number, number] {
  const [x, y] = xy.split(",");
  return [Number(x), Number(y)];
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

  // const mineResolved = $derived<PixelsMapTimestamped>({
  //   ...(pixels.mine?.value || {}),
  //   ...buffer,
  // });

  // const allResolved = $derived.by<{ [key: string]: PixelsMapTimestamped }>(() => {
  //   const resolved: { [key: string]: PixelsMapTimestamped } = {};
  //   Object.values(pixels.all).forEach((p) => {
  //     resolved[p.uuid] = p.value;
  //   });
  //   // resolved[clients.agentKeyB64] = mineResolved;
  //   return resolved;
  // });

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
    return toFlat(latest).filter((p) => p[2] !== null);
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
