import { defineConfig } from "wdc";

export default defineConfig({
  version: "0.1.0",
  changeLog: `
    # 0.1.0
     - There is an infinite grid-based canvas you can pan and zoom
     - You can drag squares to create frames that can have embedded Weave assets
     - You can resize, move and delete the frames
     - Frames are synced automatically to every group member
     - Uses Generic DNA as Holochain backend
     - Uses Svelte 5 for UI
     - Uses Weave Dev Context for development environment
  `,
  name: "Substrate",
  subtitle: "Embed Weave assets on a canvas",
  description: "Embed Weave assets on a canvas",
  githubRepo: "zequez/substrate",
  curationListUrl: "https://github.com/Zequez/weave-tool-curation",
  curationListId: "substrate",
  curationListVersionBranch: "main",
  tags: ["substrate", "canvas", "grid", "embedding"],
});
