import {
  isWeaveContext,
  WeaveClient,
  initializeHotReload,
  AppletServices,
  type WAL,
} from "@theweave/api";
import { SimpleHolochain } from "generic-dna/lib/src";
import {
  AdminWebsocket,
  AppWebsocket,
  type AppClient,
  type AppWebsocketConnectionOptions,
} from "@holochain/client";
import { ProfilesClient } from "@holochain-open-dev/profiles/dist/profiles-client.js";
import {
  encodeHashToBase64,
  type HoloHash,
  CellType,
  type DnaHash,
} from "@holochain/client";

type Context = {
  weave: WeaveClient | null;
  gdna: SimpleHolochain;
  app: AppClient;
  profiles: ProfilesClient;
  agentKey: HoloHash;
  agentKeyB64: string;
  dnaHash: DnaHash;
  wal: null | WAL;
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

  let appClient: AppClient;
  let profilesClient: ProfilesClient;
  let weaveClient: WeaveClient | null = null;
  let wal: WAL | null = null;
  if (isWeaveContext()) {
    weaveClient = await WeaveClient.connect(appletServices);

    if (weaveClient.renderInfo.type !== "applet-view") {
      throw "Not running in Weave applet view";
    }

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

    appClient = weaveClient.renderInfo.appletClient;
    profilesClient = weaveClient.renderInfo.profilesClient;
  } else {
    console.log("APP PORT", import.meta.env.APP_PORT);
    console.log("ADMIN PORT", import.meta.env.ADMIN_PORT);
    const adminWebsocket = await AdminWebsocket.connect({
      url: new URL(`ws://localhost:${import.meta.env.ADMIN_PORT}`),
    });
    let tokenResp: any = {};
    try {
      console.log("HAPP", import.meta.env.HAPP);
      tokenResp = await adminWebsocket.issueAppAuthenticationToken({
        installed_app_id: import.meta.env.HAPP,
      });
    } catch (e) {
      console.log("ERROR CONNECTING TO APP WEBSOCKET", e);
      throw e;
    }

    const x = await adminWebsocket.listApps({});
    console.log("Apps", x);
    const cellIds = await adminWebsocket.listCellIds();
    console.log("CELL IDS", cellIds);
    await adminWebsocket.authorizeSigningCredentials(cellIds[0]);

    console.log(
      "appPort and Id is",
      import.meta.env.APP_PORT,
      import.meta.env.HAPP
    );

    appClient = await AppWebsocket.connect({
      url: new URL(`ws://localhost:${import.meta.env.APP_PORT}`),
      token: tokenResp.token,
    });

    profilesClient = new ProfilesClient(appClient, import.meta.env.HAPP);
  }

  const genericZomeClient = await SimpleHolochain.connect(appClient, {
    role_name: import.meta.env.HAPP,
    zome_name: "generic_zome",
  });

  const appInfo = await appClient.appInfo();
  if (!appInfo) {
    console.log("App info was null?");
    throw "App info was null for some reason";
  }
  const dnaHash = (appInfo.cell_info[import.meta.env.HAPP][0] as any)[
    CellType.Provisioned
  ].cell_id[0];

  console.log("FINISHED SETTING UP CLIENTS");

  context = {
    weave: weaveClient,
    gdna: genericZomeClient,
    app: appClient,
    profiles: profilesClient,
    agentKey: appClient.myPubKey,
    agentKeyB64: encodeHashToBase64(appClient.myPubKey),
    dnaHash,
    wal,
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
  get wal() {
    return context.wal;
  },
};
