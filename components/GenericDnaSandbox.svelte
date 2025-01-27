<script lang="ts">
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
  } from "@holochain/client";
  import cx from "classnames";
  import LS from "../lib/localStorageSyncedState.svelte";
  import { hashEq, hashSlice, relativeTimeFormat } from "../lib/utils";

  const { H }: { H: SimpleHolochain } = $props();

  // What if I get a duplicate UUID from the network?
  //   - Treat as the same object
  //   - Choose the thing with the latest timestamp
  //   - Delete the other thing

  type ParsedThing = {
    content: ThingContent;
    id: string;
    creator: string;
    created_at: Date;
    updated_at: Date | null;
  };

  type ThingContent = {
    type: string;
    uuid: string;
    value: any;
    timestamp: number;
  };

  // type ThingStatus = {status: 'unknown'}
  let thingsLoadedFromNetworkAt = $state<number | null>(null);
  // let latestNetworkThings = LS.state<Thing[]>("NETWORK_THINGS", []);
  let firstLoaded = $state<boolean>(false);
  let latestNetworkThings = $state<Thing[]>(readNetCache());
  // let latestNetworkThings = $state<Thing[]>([]);
  let latestNetworkThingsParsed = $derived.by<[Thing, ParsedThing][]>(() => {
    console.log("LATEST NETWORK THINGS", latestNetworkThings);
    return latestNetworkThings.map((t) => [
      t,
      {
        content: JSON.parse(t.content) as ThingContent,
        id: encodeHashToBase64(t.id),
        creator: encodeHashToBase64(t.creator),
        created_at: new Date(t.created_at / 1000),
        updated_at: t.updated_at ? new Date(t.updated_at / 1000) : null,
      },
    ]);
  });

  const NET_CACHE_KEY = "GENERIC_DNA_SANDBOX_NET_CACHE";
  $effect(() => {
    const encodable = latestNetworkThings.map((t) => ({
      ...t,
      id: encodeHashToBase64(t.id),
      creator: encodeHashToBase64(t.creator),
    }));
    const data = JSON.stringify(encodable);
    localStorage.setItem(NET_CACHE_KEY, data);
  });

  function readNetCache() {
    try {
      const data = JSON.parse(localStorage.getItem(NET_CACHE_KEY));
      return data.map((t) => ({
        ...t,
        id: decodeHashFromBase64(t.id),
        creator: decodeHashFromBase64(t.creator),
      }));
    } catch (e) {
      return [];
    }
  }

  const ANCHOR_NODE = { type: "Anchor" as "Anchor", id: "ALL_THINGS" };

  onMount(() => {
    // H.batchGetNodeAndLinkedNodeIds
    const unsub = H.subscribeToNode(ANCHOR_NODE, async (status) => {
      console.log("ANCHOR NODE STATUS", status);
      if (status.status === "complete") {
        const originalThingsHashes = status.value.linkedNodeIds
          .filter((node) => node.node_id.type === "Thing")
          .map((node) => node.node_id.id as HoloHash);
        console.log(
          "HASHES",
          originalThingsHashes,
          originalThingsHashes.map(encodeHashToBase64)
        );
        const allThings = await H!.getThings(originalThingsHashes);

        // The updated thing ID is useless, replace the ID with the
        // original thing hash
        const allThingsWithOriginalId = allThings.map((t, i) => {
          if (t) {
            return { ...t, id: originalThingsHashes[i] };
          } else {
            return null;
          }
        });

        console.log("ALL THINGS", allThingsWithOriginalId);

        // const allRevisions = await H!.callZome(
        //   "get_all_revisions_for_thing",
        //   thingsHashes[0]
        // );
        // console.log("ALLLLLL", allRevisions);
        // console.log("NetworkThings", allThings);
        latestNetworkThings = allThingsWithOriginalId.filter((t) => t);
        thingsLoadedFromNetworkAt = Date.now();
        firstLoaded = true;
      }
    });

    return unsub;
  });
  let isOpen = LS.state("GENERIC_DNA_SANDBOX_OPEN", false);
  // let tab = localStorageSyncedState("GENERIC_DNA_SANDBOX_TAB", "net-local" );

  let createThingType = $state<string>("");
  let createThingContent = $state<string>("");
  let createThingParsedContent = $derived.by(() => {
    try {
      return JSON.parse(createThingContent);
    } catch (e) {
      return null;
    }
  });

  const localThingsContentInitial: ThingContent[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("CREATED_THINGS") ?? "[]");
    } catch (e) {
      return [];
    }
  })();
  let localThingsContent = $state<ThingContent[]>(localThingsContentInitial);
  $effect(() => {
    localStorage.setItem("CREATED_THINGS", JSON.stringify(localThingsContent));
  });
  async function handleCreateThing() {
    if (createThingParsedContent) {
      // thingBeingCreated = true;
      const content: ThingContent = {
        type: createThingType,
        uuid: crypto.randomUUID(),
        value: createThingParsedContent,
        timestamp: Date.now(),
      };

      localThingsContent = [...localThingsContent, content];
      createThingType = "";
      createThingContent = "";
    }
  }
  let deleting = $state(false);
  function clearRemoteCache() {
    // latestNetworkThings.reset();
    latestNetworkThings = [];
  }
  async function deleteAllRemote() {
    deleting = true;
    console.log(`Deleting ${latestNetworkThings.length} things`);
    for (let thing of latestNetworkThings) {
      console.log("Deleting thing", thing.id);
      await H.deleteThing(thing.id, true, true);
    }
    deleting = false;
  }

  function deleteAllLocal() {
    localThingsContent = [];
  }

  let editingThingId = $state<null | string>(null);
  /**
   * net = Only in the network
   * loc = Only in the local store
   * eq = In both the network and the local store and equal timestamp
   * net-upd = In both the network and the local store and net is more recent
   * loc-upd = In both the network and the local store and loc is more recent
   */
  type ContentResolutionCase =
    | "unk"
    | "net"
    | "loc"
    | "eq"
    | "net-upd"
    | "loc-upd";
  let resolvedThingsContentByUuid = $derived.by(() => {
    const networkContentByUuid: { [key: string]: ThingContent } =
      latestNetworkThingsParsed.reduce((all, [_, pthing]) => {
        all[pthing.content.uuid] = pthing.content;
        return all;
      }, {});
    const localContentByUuid: { [key: string]: ThingContent } =
      localThingsContent.reduce((all, pthing) => {
        all[pthing.uuid] = pthing;
        return all;
      }, {});

    let allUuids: string[] = Array.from(
      new Set(
        Object.keys(networkContentByUuid).concat(
          Object.keys(localContentByUuid)
        )
      )
    );

    const resolved: {
      [key: string]: [ContentResolutionCase, ThingContent];
    } = allUuids.reduce((all, uuid) => {
      const net = networkContentByUuid[uuid];
      const loc = localContentByUuid[uuid];
      if (!net && loc) {
        if (firstLoaded) {
          all[uuid] = ["loc", loc];
        } else {
          all[uuid] = ["unk", loc];
        }
      } else if (!loc && net) {
        all[uuid] = ["net", net];
      } else {
        if (loc.timestamp > net.timestamp) {
          console.log(loc, net);
          all[uuid] = ["loc-upd", loc];
        } else if (net.timestamp > loc.timestamp) {
          all[uuid] = ["net-upd", net];
        } else {
          all[uuid] = ["eq", loc];
        }
      }
      return all;
    }, {});

    return resolved;
  });
  let editingThingResolved = $derived(
    resolvedThingsContentByUuid[editingThingId]
  );
  // let editingThingContent = $derived(() => {

  // })
  // let editingContent = $derived.by(() => {
  //   if (editingNetworkThing)
  //   const createdThing = createdThingsContent.find((c) => c.uuid === editingThingId);

  // })
  function handleClickThingContent(uuid: string) {
    editingThingId = uuid;
    editingThingContent = resolvedThingsContentByUuid[uuid][1].value;
    editingThingContentIsValid = true;
  }

  let editingThingContent = $state("");
  let editingThingContentIsValid = $state(true);
  function handleUpdateEditingThingContent(ev: Event) {
    const input = ev.target as HTMLTextAreaElement;
    const value = input.value;
    editingThingContent = value;

    try {
      const parsedValue = JSON.parse(editingThingContent);
      // TODO: Add further validation here
      if (editingThingResolved) {
        const resolution = editingThingResolved[0];
        const content = editingThingResolved[1];
        // const uuid = content.uuid;
        if (resolution === "net" || resolution === "net-upd") {
          const newContent = {
            ...content,
            value: parsedValue,
            timestamp: Date.now(),
          };
          localThingsContent = [...localThingsContent, newContent];
        } else if (
          resolution === "loc" ||
          resolution === "loc-upd" ||
          resolution === "eq"
        ) {
          // Update the local
          localThingsContent.find((t, i) => {
            if (t.uuid === content.uuid) {
              localThingsContent[i] = {
                ...t,
                value: parsedValue,
                timestamp: Date.now(),
              };
              return true;
            } else {
              return false;
            }
          });
        }
      }
    } catch (e) {
      editingThingContentIsValid = false;
    }
  }

  // let expectedUuidsFromNetwork = localStorageSyncedState<string[]>(
  //   "EXPECTED_UUIDS_FROM_NETWORK",
  //   []
  // );
  // let createdTimestamps = localStorageSyncedState<{ [key: string]: number }>(
  //   "CREATED_THINGS_TIMESTAMPS",
  //   {}
  // );
  type NetworkAction = {
    type: "create" | "update" | "delete";
    uuid: string;
    callTimestamp: number;
    thingTimestamp: number;
  };
  let networkActions = LS.state<NetworkAction[]>(
    "GENERIC_DNA_NETWORK_ACTIONS",
    []
  );
  function lastActionFor(uuid: string) {
    const action = networkActions.value.findLast((a) => a.uuid === uuid);
    return action;
  }
  const RETRY_ZOME_CALL = 5 * 1000;
  function shouldRetry(timestamp: number) {
    return timestamp < Date.now() - RETRY_ZOME_CALL;
  }
  function last<T>(arr: T[]) {
    return arr[arr.length - 1];
  }

  // let networkActions = localStorageSyncedState<{ [key: string]: {
  //   createdTimestamps: number[],
  //   updatedTimestamps: [number, number][],
  //   deletedTimestamps: number[],
  //  } }>('NETWORK_ACTIONS', {});
  // let updatesTimestamps = $state<{ [key: string]: number }>({});
  // let submittedThingsCreations = $state<[string, number][]>([]);
  // let submittedThingsUpdates = $state<[string, number][]>([]);
  // This effect can actually just run on demand, not when the state changes
  // Will create a set of zome calls for creating or updating a thing in order
  // to sync the local state to the network
  // Will clean up the local state if the network content is newer or equal

  function resolveTasks(): (() => Promise<Thing>)[] {
    let tasks: (() => Promise<Thing>)[] = [];

    Object.values(resolvedThingsContentByUuid).forEach(
      ([resolution, thingContent]) => {
        const lastAction = lastActionFor(thingContent.uuid);

        if (resolution === "loc") {
          // loc = Means only local
          // Create

          if (
            !lastAction ||
            (lastAction.type === "create" &&
              shouldRetry(lastAction.callTimestamp))
          ) {
            tasks.push(async () => {
              try {
                networkActions.value.push({
                  type: "create",
                  uuid: thingContent.uuid,
                  callTimestamp: Date.now(),
                  thingTimestamp: thingContent.timestamp,
                });
                const thing = await H.createThing(
                  JSON.stringify(thingContent),
                  [
                    {
                      direction: LinkDirection.From,
                      node_id: ANCHOR_NODE,
                    },
                  ]
                );
                return thing;
              } catch (e) {
                console.error("Failed to create thing", thingContent, e);
                return null;
              }
            });
          } else {
            console.log(
              "Create action already submitted ",
              hashSlice(thingContent.uuid, 5)
            );
          }

          // #2 If it's already in the network this effect will run again with loc-upd
          // when we get the thing from the network
        } else if (resolution === "loc-upd") {
          // Means net and local, but local is more recent
          if (
            !lastAction ||
            lastAction.thingTimestamp < thingContent.timestamp ||
            (lastAction.thingTimestamp === thingContent.timestamp &&
              shouldRetry(lastAction.callTimestamp))
          ) {
            const networkThing = latestNetworkThingsParsed.find(
              ([thing, pthing]) => {
                return pthing.content.uuid === thingContent.uuid;
              }
            );
            if (networkThing) {
              console.log("NETWORK THING TO UPDATE", networkThing);
              tasks.push(async () => {
                networkActions.value.push({
                  type: "update",
                  uuid: thingContent.uuid,
                  callTimestamp: Date.now(),
                  thingTimestamp: thingContent.timestamp,
                });
                // H!.getThings(networkThing)
                // const originalThing = await H!.callZome(
                //   "get_original_thing",
                //   networkThing[0].id
                // );
                // console.log("GOTTEN ORIGINAL THING", originalThing);
                // const latestThing = await H!.callZome(
                //   "get_all_linked_node_ids",
                //   {
                //     type: "Thing",
                //     id: networkThing[0].id,
                //   }
                // );
                // console.log("GOTTEN LATEST THING", latestThing);
                const hash = networkThing[0].id;
                console.log(
                  "UPDATING THING CALL",
                  hash,
                  encodeHashToBase64(hash),
                  networkThing[0]
                );
                const thing = await H.updateThing(
                  $state.snapshot(networkThing[0].id),
                  JSON.stringify(thingContent)
                );
                return thing;
              });
            } else {
              console.error(
                "This must be an unexpected edge case; thing is loc-upd and not in the network array",
                thingContent
              );
            }
          } else {
            // console.log(
            //   "Skipping update action for now",
            //   hashSlice(thingContent.uuid, 5)
            // );
          }
        } else if (resolution === "net") {
          // Means only net
          // Nothing to do
        } else if (resolution === "net-upd") {
          // Means net and local, but net is more recent
          // Delete the local
        } else if (resolution === "eq") {
          // Delete the local
        }
      }
    );

    return tasks;
  }
  // $effect(() => {
  //   console.log("EFFECT RESOLVE TASKS", $state.snapshot(tasks).length);
  //   if (tasks.length > 0) return;
  //   // #1 What if I update a thing that is still being created (Solved)

  //   // #2 What if there is a local state of stuff that is in the network but it has
  //   // not loaded yet (Solved)

  // });

  let syncEnabled = LS.state("GENERIC_DNA_SYNC_ENABLED", true);
  onMount(() => {
    let runTasksTimeout: any = null;
    async function runTasks() {
      if (syncEnabled.value) {
        const tasks = resolveTasks();
        console.log(`RUNNING ${$state.snapshot(tasks).length} TASKS`);
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i]) {
            await tasks[i]();
            tasks[i] = null;
          }
        }
      }
      runTasksTimeout = setTimeout(runTasks, 500);
    }
    runTasks();
    return () => clearTimeout(runTasksTimeout);
  });
</script>

<button
  class={cx(
    "absolute z-150 top-0 left-0 px2 text-white rounded-br-md bg-blue-500",
    {
      "bg-blue-600": isOpen,
    }
  )}
  onclick={() => (isOpen.value = !isOpen.value)}>Generic DNA</button
>

{#snippet thingContent(c: ThingContent)}
  {@const timestamp = new Date(c.timestamp)}
  <button
    class="bg-black/10 rounded-md w-full group"
    onclick={() => handleClickThingContent(c.uuid)}
  >
    <div
      class="bg-blue-400 text-white rounded-t-md flex group-hover:bg-blue-500"
    >
      <div class="bg-amber-500 rounded-tl-md px1 group-hover:bg-amber-600">
        {c.type}
      </div>
      <div class="flex-grow text-right px1">{hashSlice(c.uuid, 10)}</div>
    </div>
    <div
      class="bg-gray-300 group-hover:bg-gray-400 text-white px2"
      title={timestamp.toISOString()}
    >
      {relativeTimeFormat(timestamp)} (-{Math.round(
        (Date.now() - c.timestamp) / 1000
      )}s)
    </div>
    <div
      class="bg-white group-hover:bg-gray-100 rounded-b-md b-1 b-t-0 b-black/10 p2 font-mono"
    >
      {JSON.stringify(c.value, null, 2)}
    </div>
  </button>
{/snippet}

{#snippet networkThing(pthing: ParsedThing)}
  <div class="">
    <div class="text-white flex">
      <div class="flex-grow bg-blue-500 rounded-tl-md px2">
        {hashSlice(pthing.id, 8)}
      </div>
      <div class="bg-green-400 rounded-tr-md px2">
        {hashSlice(pthing.creator, 4)}
      </div>
    </div>
    <div class="bg-gray-300 text-white flex px2">
      <div>{relativeTimeFormat(pthing.created_at)}</div>
      {#if pthing.updated_at}
        <div>{relativeTimeFormat(pthing.updated_at)}</div>
      {/if}
    </div>
    <div class="bg-white rounded-b-md p4 b-1 b-t-0 b-black/20">
      {@render thingContent(pthing.content)}
    </div>
  </div>
{/snippet}

{#if isOpen.value}
  <div
    class="absolute z-140 flex flex-col top-0 left-0 w-3/4 h-3/4 bg-gray-100 rounded-br-md shadow-lg"
  >
    <div class="flex p4 pt-8 flex-grow space-x-2 h-0">
      <div class="flex flex-col w-6/8 h-full overflow-auto">
        {#each Object.values(resolvedThingsContentByUuid) as [resolution, thingCont] (thingCont.uuid)}
          <div class="bg-black/10 rounded-md mt2">
            <div class="text-center">
              <span
                class={cx("text-white rounded-md px1", {
                  "bg-green-500": resolution === "loc",
                  "bg-green-300": resolution === "loc-upd",
                  "bg-blue-500": resolution === "net",
                  "bg-blue-300": resolution === "net-upd",
                  "bg-gray-500": resolution === "eq",
                })}>{resolution}</span
              >
            </div>
            <div class="flex p1 space-x-1">
              {#if resolution !== "loc"}
                {@const foundNetworkThing = latestNetworkThingsParsed.find(
                  ([thing, pthing]) => pthing.content.uuid === thingCont.uuid
                )}
                {#if foundNetworkThing}
                  {@render networkThing(foundNetworkThing[1])}
                {/if}
              {/if}
              {@render thingContent(thingCont)}
            </div>
          </div>
        {/each}
      </div>
      <!-- <div class="flex flex-col w-1/2 h-full space-y-4 overflow-auto">
        <div class="text-lg">Network</div>
        {#each latestNetworkThingsParsed as [thing, pthing] (pthing.id)}
          {@render networkThing(pthing)}
        {/each}
      </div> -->

      <div class="bg-black/10 w-[1px] flex-grow-0"></div>

      <!-- <div class="flex flex-col w-1/2 h-full space-y-4 overflow-auto">
        <div class="text-lg">Local</div>
        {#each localThingsContent as tc}
          {@render thingContent(tc)}
        {/each}
      </div> -->

      <div class="flex flex-col w-2/8 h-full overflow-auto">
        Network actions
        <div class="flex flex-col-reverse text-xs">
          {#each networkActions.value as action}
            <div class="bg-gray-200 rounded-md p.5 mt2">
              <div>
                <span
                  class={cx("rounded-md px1 text-white", {
                    "bg-red-500": action.type === "delete",
                    "bg-amber-500": action.type === "update",
                    "bg-green-500": action.type === "create",
                  })}>{action.type}</span
                >
                @ {relativeTimeFormat(action.callTimestamp)}
              </div>
              <div>
                {hashSlice(action.uuid, 5)} @ {relativeTimeFormat(
                  action.thingTimestamp
                )}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    <!-- <div class="bg-gray-200 flex flex-wrap">
      Expected UUIDs:
      {#each expectedUuidsFromNetwork.value as uuid (uuid)}
        <div class="bg-blue-500 text-white ml4 rounded-md px1">
          {hashSlice(uuid, 5)}
        </div>
      {/each}
    </div> -->
    <!-- CONTROLS -->
    <div class="bg-blue-100 h-40 flex">
      <div class="w-1/3 p2 flex flex-col">
        {#if editingThingResolved}
          {@const [resolution, content] = editingThingResolved}
          <div class="flex text-white w-full">
            <div class="bg-red-500 px1 rounded-tl-md">{resolution}</div>
            <div class="bg-amber-500 px1">{content.type}</div>
            <div class="bg-gray-400 flex-grow px1 rounded-tr-md">
              {hashSlice(content.uuid, 4)}
            </div>
          </div>
          <div class="flex-grow mb2">
            <textarea
              class="h-full w-full rounded-b-md p2"
              oninput={handleUpdateEditingThingContent}
              >{editingThingContent}</textarea
            >
          </div>
          <!-- <button
            class="bg-green-500 disabled:bg-green-500! hover:bg-green-400 disabled:opacity-25 rounded-md text-white b b-black/10 w-full"
            >Update</button
          > -->
        {/if}
      </div>
      <div class="w-1/3 p2 flex flex-col">
        <input
          class="w-full b-1 p1 b-black/10 rounded-t-md"
          type="text"
          placeholder="Type"
          bind:value={createThingType}
        />
        <textarea
          class={cx("w-full b-1 b-t-0 p1 b-black/10 rounded-b-md mb2", {
            "outline-red-500":
              createThingParsedContent === null && createThingContent != "",
          })}
          placeholder="Content"
          bind:value={createThingContent}
        ></textarea>
        <button
          disabled={!createThingType || createThingParsedContent === null}
          class="bg-green-500 disabled:bg-green-500! hover:bg-green-400 disabled:opacity-25 rounded-md text-white b b-black/10 w-full"
          onclick={handleCreateThing}>Create</button
        >
      </div>
      <div class="w-1/3 flex flex-col space-y-2 p2">
        <button
          onclick={clearRemoteCache}
          class="bg-red-500 hover:bg-red-600 rounded-md disabled:opacity-25 text-white b b-black/10 w-full"
          >Clear remote cache</button
        >
        <button
          onclick={deleteAllLocal}
          class="bg-red-500 hover:bg-red-600 rounded-md disabled:opacity-25 text-white b b-black/10 w-full"
          >Clear local cache</button
        >
        <button
          disabled={deleting}
          onclick={deleteAllRemote}
          class="bg-red-500 hover:bg-red-600 rounded-md disabled:opacity-25 text-white b b-black/10 w-full"
          >Delete All Remote</button
        >
        <label>
          <input type="checkbox" bind:checked={syncEnabled.value} /> Sync
        </label>
      </div>
    </div>
  </div>
{/if}
