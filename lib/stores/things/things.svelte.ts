import { onMount } from "svelte";
import {
  encodeHashToBase64,
  decodeHashFromBase64,
  type HoloHash,
  type AppClient,
} from "@holochain/client";
import { WeaveClient } from "@theweave/api";
import { type BoxedFrame } from "../../Frame";
import LS from "./local.svelte";
import GDNA from "./gdna.svelte";
import clients from "../../clients";
// import SYN from "./syn.svelte";

type ThingWrapped<T extends string, K> = {
  type: T;
  value: K;
  uuid: string;
  timestamp: number;
  createdBy: string;
  updatedBy: null | string;
  deleted: boolean;
};

type StorageSystem<T> = {
  readonly all: { [key: string]: T };
  set: (uuid: string, val: T) => void;
  readonly ready: boolean;
};

/**
 * You can define any number of storages,
 * the first one must be synchronous and local.
 * Changes to entries in one storage will be reflected in all asynchronously
 * The resolved entry will be the one with the highest timestamp
 */

function typeOfThing<const T extends string, K>(
  thingType: T,
  storageKey: string
) {
  type $ThingWrapped = ThingWrapped<T, K>;

  let lsFrames = LS.state<$ThingWrapped>(storageKey);
  let gdnaFrames = GDNA.things<$ThingWrapped>(storageKey);

  // let synFrames = SYN.document<BoxedFrameWrapper>("boxedFrames");

  const stores: StorageSystem<$ThingWrapped>[] = [lsFrames, gdnaFrames];
  const S = stores[0];

  let resolvedFrames: {
    [key: string]: {
      resolution: [boolean, boolean];
      value: $ThingWrapped;
    };
  } = $derived.by(() => {
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
        value: $ThingWrapped;
      };
    } = {};

    function resolve<const T extends $ThingWrapped[]>(
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
      const result = resolve(...storages);
      let latest: $ThingWrapped | null = null;
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

  const outputFrames = $derived.by<{ [key: string]: $ThingWrapped }>(() => {
    const output = {};
    for (let uuid in resolvedFrames) {
      if (!resolvedFrames[uuid].value.deleted) {
        output[uuid] = resolvedFrames[uuid].value;
      }
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

  async function create(boxedFrame: K) {
    const uuid = crypto.randomUUID();
    const boxedFrameWrapper: $ThingWrapped = {
      uuid,
      type: thingType,
      timestamp: new Date().getTime(),
      createdBy: clients.agentKeyB64,
      updatedBy: null,
      value: boxedFrame,
      deleted: false,
    };
    S.set(uuid, boxedFrameWrapper);
  }

  async function update(uuid: string, boxedFrame: Partial<BoxedFrame>) {
    console.log("Updating frame", uuid, boxedFrame);
    const storedFrame = S.all[uuid];
    if (!storedFrame) throw "Boxed frame not found";
    S.set(uuid, {
      ...storedFrame,
      value: { ...storedFrame.value, ...boxedFrame },
      timestamp: new Date().getTime(),
      updatedBy: clients.agentKeyB64,
    });
  }

  async function remove(uuid: string) {
    console.log("Removing frame", uuid);
    const storedFrame = S.all[uuid];
    if (!storedFrame) throw "Boxed frame not found";
    S.set(uuid, {
      ...storedFrame,
      timestamp: new Date().getTime(),
      updatedBy: clients.agentKeyB64,
      deleted: true,
    });
  }

  return {
    get all() {
      return outputFrames;
    },
    create,
    update,
    remove,
  };
}

export default {
  typeOfThing,
};
