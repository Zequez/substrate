import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import { mount } from "svelte";

import App from "./components/App.svelte";

import {
  isWeaveContext,
  WeaveClient,
  initializeHotReload,
} from "@theweave/api";
import { SimpleHolochain } from "generic-dna/lib/src";

(async function () {
  if (import.meta.env.DEV) {
    try {
      console.log("Initializing hot reload");
      await initializeHotReload();
    } catch (e) {
      console.warn("Could not initialize Weave applet hot-reloading");
    }
  }

  const weaveClient = isWeaveContext()
    ? await WeaveClient.connect()
    : undefined;

  if (!weaveClient) throw "Not running in Weave";

  if (weaveClient.renderInfo.type !== "applet-view") {
    throw "Not running in Weave applet view";
  }

  const genericZomeClient = await SimpleHolochain.connect(
    weaveClient.renderInfo.appletClient,
    {
      role_name: "substrate",
      zome_name: "generic_zome",
    }
  );

  mount(App, {
    target: document.body,
    props: { weaveClient, genericZomeClient },
  });
})();
