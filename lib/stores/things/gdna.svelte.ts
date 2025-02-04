import { onMount } from "svelte";
import {
  encodeHashToBase64,
  type HoloHash,
  decodeHashFromBase64,
} from "@holochain/client";
import {
  SimpleHolochain,
  type Thing,
  LinkDirection,
} from "generic-dna/lib/src";
import clients from "../../clients";
import LS from "../ls-synced.svelte";

type Wrapper = {
  type: string;
  // id: number; // Used to match the thing if it's staged
  value: any;
  uuid: string;
  timestamp: number;
  createdBy: string;
  updatedBy: null | string;
  deleted: boolean;
};

type ParsedThing<T> = {
  content: T;
  id: string;
  creator: string;
  created_at: Date;
  updated_at: Date | null;
};

type NetworkAction = {
  uuid: string;
  type: "create" | "update" | "delete";
  callTimestamp: number;
  thingTimestamp: number;
};

// type NetworkEvent = {
//   type: 'discovered'
// }

function things<T extends Wrapper>(anchorNodeId: string) {
  let fetchedTimestamp = $state<number>(0);
  let networkActions = LS.state<NetworkAction[]>(
    `GDNA_NETWORK_ACTIONS_${anchorNodeId}`,
    []
  );
  let firstLoaded = $state<boolean>(false);

  const NET_CACHE_KEY = `GENERIC_DNA_SANDBOX_NET_CACHE_${anchorNodeId}`;
  let things = $state<{ [key: string]: ParsedThing<T> }>(readNetCache());
  $effect.root(() => {
    $effect(() => {
      localStorage.setItem(NET_CACHE_KEY, JSON.stringify(things));
    });
  });

  function readNetCache() {
    try {
      const data = JSON.parse(localStorage.getItem(NET_CACHE_KEY) || "{}") as {
        [key: string]: ParsedThing<T>;
      };
      for (let uuid in data) {
        data[uuid].updated_at = data[uuid].updated_at
          ? new Date(data[uuid].updated_at)
          : null;
        data[uuid].created_at = new Date(data[uuid].created_at);
      }

      console.log("NET CACHE", data);

      return data;
    } catch (e) {
      console.log("ERROR reading net cache", e);
      return {};
    }
  }

  function lastActionFor(uuid: string) {
    const action = networkActions.value.findLast((a) => a.uuid === uuid);
    return action;
  }
  const RETRY_ZOME_CALL = 10 * 1000;
  function shouldRetry(timestamp: number) {
    return timestamp < Date.now() - RETRY_ZOME_CALL;
  }

  const ANCHOR_NODE = { type: "Anchor" as "Anchor", id: anchorNodeId };

  const unsub = clients.gdna.subscribeToNode(ANCHOR_NODE, async (status) => {
    // console.log(`ANCHOR NODE ${anchorNodeId}`, status);
    if (status.status === "complete") {
      const originalThingsHashes = status.value.linkedNodeIds
        .filter((node) => node.node_id.type === "Thing")
        .map((node) => node.node_id.id as HoloHash);

      const allThings = await clients.gdna.getThings(originalThingsHashes);

      const allThingsWithOriginalId = allThings.map((t, i) => {
        if (t) {
          return { ...t, id: originalThingsHashes[i] };
        } else {
          return null;
        }
      });

      // console.log(`Network Things ${anchorNodeId}`, allThings);
      allThingsWithOriginalId.forEach((thing) => {
        if (thing) {
          try {
            const content = JSON.parse(thing.content) as T;
            const stored = things[content.uuid];
            if (!stored || stored.content.timestamp < content.timestamp) {
              console.log(`Thing from network ${content.uuid}`);
              const parsedThing = thingToParsed(thing, content);
              things[content.uuid] = parsedThing;
              // onThingDiscovered(parsedThing);
            }
          } catch (e) {
            console.error("Thing badly formatted", thing);
          }
        }
      });

      fetchedTimestamp = Date.now();
      if (!firstLoaded) {
        firstLoaded = true;
      }
    }
  });

  async function create(content: T) {
    if (things[content.uuid]) {
      return;
    }
    const lastAction = lastActionFor(content.uuid);
    if (lastAction && !shouldRetry(lastAction.callTimestamp)) {
      return;
    }

    const thing = await clients.gdna.createThing(JSON.stringify(content), [
      {
        direction: LinkDirection.From,
        node_id: ANCHOR_NODE,
      },
    ]);

    const parsedThing = thingToParsed(thing, content);
    things[content.uuid] = parsedThing;
  }

  async function update(uuid: string, content: T) {
    if (!things[content.uuid]) {
      return;
    }

    const lastAction = lastActionFor(content.uuid);
    if (
      lastAction &&
      lastAction.thingTimestamp === content.timestamp &&
      !shouldRetry(lastAction.callTimestamp)
    ) {
      return;
    }

    const currentThing = things[uuid];
    if (!currentThing) throw "Trying to update non-existent thing";
    const thing = await clients.gdna.updateThing(
      decodeHashFromBase64(currentThing.id),
      JSON.stringify(content)
    );
    const parsedThing = thingToParsed(thing, content);
    things[uuid] = parsedThing;
  }

  function set(uuid: string, val: T) {
    console.log("Setting GDNA", uuid, val);
    if (!firstLoaded) throw "Not ready";
    if (things[uuid]) {
      update(uuid, val);
    } else {
      create(val);
    }
  }

  const unwrappedThings: { [key: string]: T } = $derived(
    Object.values(things).reduce(
      (all, t) => {
        all[t.content.uuid] = t.content;
        return all;
      },
      {} as { [key: string]: T }
    )
  );

  return {
    // create,
    // update,
    set,
    get all() {
      return unwrappedThings;
    },
    get fetchedTimestamp() {
      return fetchedTimestamp;
    },
    get ready() {
      return firstLoaded;
    },
    getHash(uuid: string) {
      if (!things[uuid]) return null;
      return decodeHashFromBase64(things[uuid].id);
    },
    findByHash(hash: HoloHash) {
      const b64 = encodeHashToBase64(hash);
      const thing = Object.values(things).find((t) => t.id === b64);
      return thing ? thing.content : null;
    },
  };

  // UTILS

  function thingToParsed(thing: Thing, content: T) {
    const parsedThing: ParsedThing<T> = {
      content,
      id: encodeHashToBase64(thing.id),
      creator: encodeHashToBase64(thing.creator),
      created_at: new Date(thing.created_at),
      updated_at: thing.updated_at ? new Date(thing.updated_at) : null,
    };
    return parsedThing;
  }
}

export default {
  things,
};
