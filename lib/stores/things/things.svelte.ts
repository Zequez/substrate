import { onMount } from "svelte";
import {
  encodeHashToBase64,
  decodeHashFromBase64,
  type HoloHash,
} from "@holochain/client";
import { WeaveClient, weaveUrlFromWal, type WAL } from "@theweave/api";
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
  storageKey: string,
  onePerAgent: boolean = false
) {
  type $ThingWrapped = ThingWrapped<T, K>;

  let lsThings = LS.state<$ThingWrapped>(storageKey);
  let gdnaThings = GDNA.things<$ThingWrapped>(storageKey, thingType);

  // let synFrames = SYN.document<BoxedFrameWrapper>("boxedFrames");

  const stores: StorageSystem<$ThingWrapped>[] = [lsThings, gdnaThings];
  const S = stores[0];

  let resolvedThings: {
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

    // console.log("ALL UUIDS", uuids);

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

  const outputThings = $derived.by<{ [key: string]: $ThingWrapped }>(() => {
    const output: { [key: string]: $ThingWrapped } = {};
    for (let uuid in resolvedThings) {
      if (!resolvedThings[uuid].value.deleted) {
        output[uuid] = resolvedThings[uuid].value;
      }
    }
    return output;
  });

  $effect.root(() => {
    $effect(() => {
      [resolvedThings];
      doResolutionActions();
    });
  });

  function doResolutionActions() {
    // console.log("RESOLVING", resolvedFrames);
    for (let uuid in resolvedThings) {
      const { resolution, value } = resolvedThings[uuid];
      resolution.forEach((val, i) => {
        if (!val) {
          if (stores[i].ready) {
            stores[i].set(value.uuid, value);
          }
        }
      });
    }
  }

  const mine = $derived(
    onePerAgent
      ? Object.values(outputThings).find((v) => v.uuid === clients.agentKeyB64)
      : null
  );

  async function create(thingValue: K) {
    console.log(`CReating ${thingType}`, thingValue);
    const uuid = onePerAgent ? clients.agentKeyB64 : crypto.randomUUID();
    const thingWrapper: $ThingWrapped = {
      uuid,
      type: thingType,
      timestamp: new Date().getTime(),
      createdBy: clients.agentKeyB64,
      updatedBy: null,
      value: thingValue,
      deleted: false,
    };
    S.set(uuid, thingWrapper);
  }

  async function update(uuid: string | null, thingValue: Partial<K>) {
    console.log(`Updating ${thingType}`, uuid, thingValue);
    if (!onePerAgent && !uuid) throw "Must use UUID";
    const resolvedUuid = onePerAgent ? clients.agentKeyB64 : uuid!;
    const storedThing = S.all[resolvedUuid];
    if (!storedThing) throw `${thingType} not found`;
    S.set(resolvedUuid, {
      ...storedThing,
      value: { ...storedThing.value, ...thingValue },
      timestamp: new Date().getTime(),
      updatedBy: clients.agentKeyB64,
    });
  }

  async function remove(uuid: string | null) {
    console.log(`Removing ${thingType}`, uuid);
    if (!onePerAgent && !uuid) throw "Must use UUID";
    const resolvedUuid = onePerAgent ? clients.agentKeyB64 : uuid!;
    const storedFrame = S.all[resolvedUuid];
    if (!storedFrame) throw "Boxed frame not found";
    S.set(resolvedUuid, {
      ...storedFrame,
      timestamp: new Date().getTime(),
      updatedBy: clients.agentKeyB64,
      deleted: true,
    });
  }

  return {
    get all() {
      return outputThings;
    },
    get mine() {
      return mine;
    },
    create,
    update,
    remove,
    link: (uuid: string): [WAL, string] | [] => {
      const entryHash = gdnaThings.getHash(uuid);
      if (!entryHash) {
        return [];
      }
      const wal: WAL = {
        hrl: [clients.dnaHash, entryHash],
        context: { foo: "bar" },
      };
      return [wal, weaveUrlFromWal(wal)];
    },
    findByHash: (hash: HoloHash) => {
      return gdnaThings.findByHash(hash);
    },
  };
}

export default {
  typeOfThing,
};
