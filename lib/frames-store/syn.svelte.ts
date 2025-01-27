import { onMount } from "svelte";
import {
  SynClient,
  SynStore,
  WorkspaceStore,
  DocumentStore,
  SessionStore,
} from "@holochain-syn/core";
import { type AppClient } from "@holochain/client";

let synClient = $state<SynClient>(null!);
let synStore = $state<SynStore>(null!);

function init(appClient: AppClient) {
  if (synClient) throw "Already initialized";
  synClient = new SynClient(appClient, "substrate", "syn");
  synStore = new SynStore(synClient);
}

function document<T extends { timestamp: number }>(tag: string) {
  type Doc = { [key: string]: T };
  let unsub = $state<any>(null);
  let docState = $state<Doc>({});
  let documentStore = $state<DocumentStore<Doc, {}>>(null!);
  let workspaceStore = $state<WorkspaceStore<Doc, {}>>(null!);
  let sessionStore = $state<SessionStore<Doc, {}> | null>(null);
  let gottenFirstSnapshot = $state<boolean>(false);
  let ready = $derived(gottenFirstSnapshot); // && sessionStore !== null);
  onMount(async () => {
    const links = await synClient.getDocumentsWithTag(tag);
    if (links.length === 0) {
      console.log("No documents found");
      documentStore = await synStore.createDocument({}, {});
      workspaceStore = await documentStore.createWorkspace(
        `${new Date()}`,
        undefined
      );
      await synClient.tagDocument(documentStore.documentHash, tag);
    } else {
      const documentHash = links[0].target;
      const workspaces = await synClient.getWorkspacesForDocument(documentHash);
      const workspaceHash = workspaces[0];
      documentStore = new DocumentStore(synStore, documentHash);
      workspaceStore = new WorkspaceStore(documentStore, workspaceHash.target);
    }

    unsub = workspaceStore.latestState.subscribe((state) => {
      if (state.status === "complete") {
        console.log("Getting latest doc snapshot", state.value);
        docState = state.value;
        gottenFirstSnapshot = true;
      }
    });
  });

  async function joinSession() {
    if (!sessionStore) {
      sessionStore = await workspaceStore.joinSession();
    }
  }

  async function leaveSession() {
    if (sessionStore) {
      await sessionStore.leaveSession();
      sessionStore = null;
    }
  }

  onMount(() => {
    return () => {
      if (unsub) unsub();
    };
  });

  return {
    setSync: (val: boolean) => {
      if (sessionStore && val === false) {
        leaveSession();
      } else if (!sessionStore && val === true) {
        joinSession();
      }
    },
    get all() {
      return docState;
    },
    get ready() {
      return ready;
    },
    set(uuid: string, val: T) {
      if (docState[uuid].timestamp < val.timestamp) {
        if (sessionStore) {
          sessionStore.change((doc) => {
            doc[uuid] = val;
          });
        }
      }
    },
  };
}

export default {
  init,
  document,
};
