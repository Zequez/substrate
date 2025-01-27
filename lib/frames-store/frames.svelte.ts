import {
  // type AsyncStatus,
  LinkDirection,
  // NodeId,
  // NodeIdAndTag,
  // NodeStoreContent,
  SimpleHolochain,
  type Thing,
} from "generic-dna/lib/src";
import { onMount } from "svelte";
import {
  encodeHashToBase64,
  decodeHashFromBase64,
  type HoloHash,
  type AppClient,
} from "@holochain/client";
import { WeaveClient } from "@theweave/api";
import { type BoxedFrame } from "../Frame";
import LS from "./local.svelte";
import GDNA from "./gdna.svelte";
// import SYN from "./syn.svelte";

let W = $state<WeaveClient | null>(null);
let H = $state<SimpleHolochain | null>(null);
let currentAgent = $state<string>(null!);

// type AllThings = BoxedFrameThing | null;

// type NetworkedThing = BoxedFrameThing & {
//   thingId: HoloHash;
// }

function init(props: {
  appClient: AppClient;
  weaveClient: WeaveClient;
  genericZomeClient: SimpleHolochain;
}) {
  W = props.weaveClient;
  H = props.genericZomeClient;
  currentAgent = encodeHashToBase64(props.appClient.myPubKey);
  GDNA.init(H);
}

function frames() {
  type BoxedFrameWrapper = {
    type: "BoxedFrame";
    // id: number; // Used to match the thing if it's staged
    value: BoxedFrame;
    uuid: string;
    timestamp: number;
    createdBy: string;
    updatedBy: null | string;
    deleted: boolean;
  };

  let lsFrames = LS.state<BoxedFrameWrapper>("BOXED_FRAMES2");
  let gdnaFrames = GDNA.things<BoxedFrameWrapper>("BOXED_FRAMES");
  // let synFrames = SYN.document<BoxedFrameWrapper>("boxedFrames");

  const stores = [lsFrames, gdnaFrames];

  let resolvedFrames: {
    [key: string]: {
      resolution: [boolean, boolean];
      value: BoxedFrameWrapper;
    };
  } = $derived.by(() => {
    console.log(
      "EVERYHING",
      stores.map((s) => s.all)
    );
    const uuids = stores
      .map((s) => Object.keys(s.all))
      .reduce((all, v) => {
        v.forEach((uuid) => {
          if (all.indexOf(uuid) === -1) {
            all.push(uuid);
          }
        });

        return all;
      }, []);

    console.log("ALL UUIDS", uuids);

    let resolved: {
      [key: string]: {
        resolution: [boolean, boolean];
        value: BoxedFrameWrapper;
      };
    } = {};

    function resolve<const T extends BoxedFrameWrapper[]>(
      ...vals: T
    ): { [I in keyof T]: boolean } {
      const maxTimestamp = Math.max(
        ...vals.filter((v) => v).map((v) => v.timestamp)
      );
      return vals.map((v) => {
        if (!v) {
          return false;
        } else if (v.timestamp < maxTimestamp) {
          return false;
        } else {
          return true;
        }
      }) as any;
    }

    uuids.forEach((uuid) => {
      const storages = stores.map((s) => s.all[uuid]);
      console.log("STORAGES", storages);
      const result = resolve(...storages);
      let latest: BoxedFrameWrapper | null = null;
      for (let i = 0; i < result.length; ++i) {
        if (result[i]) {
          latest = storages[i];
          break;
        }
      }
      if (latest) {
        resolved[latest.uuid] = {
          resolution: result as [boolean, boolean],
          value: latest,
        };
      }
    });

    return resolved;
  });

  const outputFrames = $derived.by<{ [key: string]: BoxedFrameWrapper }>(() => {
    const output = {};
    console.log("Resolutions", resolvedFrames);
    for (let uuid in resolvedFrames) {
      console.log(uuid, resolvedFrames[uuid].resolution);
      output[uuid] = resolvedFrames[uuid].value;
    }
    return output;
  });

  $effect(() => {
    doResolutionActions();
  });

  function doResolutionActions() {
    console.log("RESOLVING", resolvedFrames);
    for (let uuid in resolvedFrames) {
      const { resolution, value: frame } = resolvedFrames[uuid];
      resolution.forEach((val, i) => {
        if (!val) {
          if (stores[i].ready) {
            stores[i].set(frame.uuid, frame);
          }
        }
      });
    }
  }

  async function create(boxedFrame: BoxedFrame) {
    const uuid = crypto.randomUUID();
    const boxedFrameWrapper: BoxedFrameWrapper = {
      uuid,
      type: "BoxedFrame",
      timestamp: new Date().getTime(),
      createdBy: currentAgent,
      updatedBy: null,
      value: boxedFrame,
      deleted: false,
    };
    lsFrames.set(uuid, boxedFrameWrapper);
  }

  async function update(uuid: string, boxedFrame: Partial<BoxedFrame>) {
    console.log("Updating frame", uuid, boxedFrame);
    let storedFrame = lsFrames.all[uuid];
    if (!storedFrame) throw "Boxed frame not found";
    lsFrames.set(uuid, {
      ...storedFrame,
      value: { ...storedFrame.value, ...boxedFrame },
      timestamp: new Date().getTime(),
      updatedBy: currentAgent,
    });
  }

  return {
    get all() {
      return outputFrames;
    },
    create,
    update,
  };
}

export default {
  init,
  frames,
};
