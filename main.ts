import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import { mount } from "svelte";

import App from "./components/App.svelte";

import {
  isWeaveContext,
  WeaveClient,
  initializeHotReload,
} from "@theweave/api";

if (import.meta.env.DEV) {
  try {
    console.log("Initializing hot reload");
    await initializeHotReload();
  } catch (e) {
    console.warn("Could not initialize Weave applet hot-reloading");
  }
}

const weaveClient = isWeaveContext() ? await WeaveClient.connect() : undefined;

mount(App, { target: document.body, props: { weaveClient } });
