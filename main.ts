import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import { mount } from "svelte";
import icon2 from "./icon2.svg";

import App from "./components/App.svelte";
import clients from "./lib/clients";
import S from "./lib/stores/main.svelte";
import type {
  AppletHash,
  AppletServices,
  AssetInfo,
  RecordInfo,
  WAL,
  WeaveServices,
} from "@theweave/api";
import { type AppClient } from "@holochain/client";

(async function () {
  const appletServices: AppletServices = {
    creatables: {},
    blockTypes: {},

    getAssetInfo: async (
      appletClient: AppClient,
      wal: WAL,
      recordInfo?: RecordInfo
    ): Promise<AssetInfo | undefined> => {
      return {
        icon_src: icon2,
        name: "Frame",
      };
    },

    search: async (
      appletClient: AppClient,
      appletHash: AppletHash,
      weaveServices: WeaveServices,
      searchFilter: string
    ) => {
      return [];
    },
  };

  await clients.connect(appletServices);
  await S.initialize();

  mount(App, {
    target: document.getElementById("app")!,
    props: {},
  });
})();
