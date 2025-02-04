import { defineConfig } from "wdc";

export default defineConfig({
  version: "0.1.1",
  id: "substrate",
  changeLog: `
# 0.1.0
  - There is an infinite grid-based canvas you can pan and zoom
  - You can drag squares to create frames that can have embedded Weave assets
  - You can resize, move and delete the frames
  - Frames are synced automatically to every group member
  - Uses Generic DNA as Holochain backend
  - Uses Svelte 5 for UI
  - Uses Weave Dev Context for development environment
# 0.1.1
  - Fixed a bug that caused syncing between peers not to work
  - You can now add frames to pocket and embed instances of Substrate that are centered around that Frame
  - You can now remove linked assets from frames
  - Added provision to prevent inifinite recursion from happening when embedding Substrate within Substrate
  - Refactored store so it can be initialized outside the UI components structure
  - Made the canvas (0,0) position be at the center of the screen
  - Made shadows all share the same z-index so they don't overlap
  - Added provision to disable pointer events on iframes while dragging so the panning doesn't get stuck
  `,
  name: "Substrate",
  subtitle: "Embed Weave assets on a canvas",
  description: "Embed Weave assets on a canvas",
  githubRepo: "zequez/substrate",
  curationListOriginalUrl:
    "https://github.com/lightningrodlabs/weave-tool-curation/",
  curationListForkUrl: "https://github.com/Zequez/weave-tool-curation",
  tags: ["substrate", "canvas", "grid", "embedding", "assemblage"],
});
