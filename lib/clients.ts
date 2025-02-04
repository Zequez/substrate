import {
  isWeaveContext,
  WeaveClient,
  initializeHotReload,
  AppletServices,
  type WAL,
  type RenderInfo,
} from "@theweave/api";
import { SimpleHolochain } from "generic-dna/lib/src";
import { type AppClient } from "@holochain/client";
import type { ProfilesClient } from "@holochain-open-dev/profiles/dist/profiles-client.d.ts";
import {
  encodeHashToBase64,
  type HoloHash,
  CellType,
  type DnaHash,
} from "@holochain/client";

type Context = {
  weave: WeaveClient;
  gdna: SimpleHolochain;
  app: AppClient;
  profiles: ProfilesClient;
  agentKey: HoloHash;
  agentKeyB64: string;
  dnaHash: DnaHash;
  dnaHashB64: string;
  wal: null | WAL;
  walDna: null | string;
  walAsset: null | string;
};

let context: Context = null!;

async function connect(appletServices: AppletServices): Promise<void> {
  if (import.meta.env.DEV) {
    try {
      console.log("Initializing hot reload");
      await initializeHotReload();
    } catch (e) {
      console.warn("Could not initialize Weave applet hot-reloading");
    }
  }

  const weaveClient = isWeaveContext()
    ? await WeaveClient.connect(appletServices)
    : undefined;

  if (!weaveClient) throw "Not running in Weave";

  if (weaveClient.renderInfo.type !== "applet-view") {
    throw "Not running in Weave applet view";
  }

  weaveClient.renderInfo.view.type;

  let wal: WAL | null = null;
  if (weaveClient.renderInfo.view.type === "asset") {
    console.log(
      "Rendering Substrate as asset",
      weaveClient.renderInfo.view.wal.hrl
    );
    console.log("CONTEXT:", weaveClient.renderInfo.view.wal.context);

    wal = weaveClient.renderInfo.view.wal;
  } else if (weaveClient.renderInfo.view.type !== "main") {
    throw "Only works as asset or main thread";
  }

  const genericZomeClient = await SimpleHolochain.connect(
    weaveClient.renderInfo.appletClient,
    {
      role_name: "substrate",
      zome_name: "generic_zome",
    }
  );

  const appClient = weaveClient.renderInfo.appletClient;
  const profilesClient = weaveClient.renderInfo.profilesClient;

  const appInfo = await appClient.appInfo();
  if (!appInfo) {
    console.log("App info was null?");
    throw "App info was null for some reason";
  }
  const dnaHash = (appInfo.cell_info["substrate"][0] as any)[
    CellType.Provisioned
  ].cell_id[0];

  context = {
    weave: weaveClient,
    gdna: genericZomeClient,
    app: appClient,
    profiles: profilesClient,
    agentKey: appClient.myPubKey,
    agentKeyB64: encodeHashToBase64(appClient.myPubKey),
    dnaHash,
    dnaHashB64: encodeHashToBase64(dnaHash),
    wal,
    walDna: wal ? encodeHashToBase64(wal.hrl[0]) : null,
    walAsset: wal ? encodeHashToBase64(wal.hrl[1]) : null,
  };
}

export default {
  connect,
  get weave() {
    return context.weave;
  },
  get gdna() {
    return context.gdna;
  },
  get app() {
    return context.app;
  },
  get profiles() {
    return context.profiles;
  },
  get agent() {
    return context.agentKey;
  },
  get agentKeyB64() {
    return context.agentKeyB64;
  },
  get dnaHash() {
    return context.dnaHash;
  },
  get dnaHashB64() {
    return context.dnaHashB64;
  },
  get wal() {
    return context.wal;
  },
  get walDna() {
    return context.walDna;
  },
  get walAsset() {
    return context.walAsset;
  },
};
