import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import "./zLayers.css";
import "svooltip/styles.css";
import { mount } from "svelte";
import icon2 from "../icon2.svg";

import App from "@ui/composer.svelte";
import S from "@stores/main.svelte";

import clients from "./clients";
import profiles from "./profiles.svelte";

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
  await profiles.connect();

  mount(App, {
    target: document.getElementById("app")!,
    props: { depth: 0 },
  });
})();
