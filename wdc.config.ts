import { defineConfig } from "wdc";

export default defineConfig({
  version: "0.1.5",
  id: "substrate",
  changeLog: `
# 0.1.5
  - Added an Excalidraw-UX-inspired toolbar with hand, select, frame and art tools
  - You can now make frames take up the whole of the screen
  - Secret hot-key Shift+Z to reverse zoom direction
  - Remove cursor ghost frame
  - Made frame controls less moving, tinier; for now
  - Show asset name along with icon with far out zoom
  - Pixels can now be selected, moved and trashed like frames
  - You can delete selection with Backspace or Delete key
  - Art tool has main and alt colors for left/right click
  - Added configurable right-click-hotkeyed tool
  - Added hand tool you can pick to pan with left click (and panning also linked to wheel click from any tool)
# 0.1.4
  - Added WASD keyboard-based movement
  - You can now select frames and move them or trash them all together
  - Some code clean up and organization
  - Improved agents display; show avatars
  - Added tooltips
# 0.1.3
  - Instant syncing with Generic DNA
  - You can now paint the canvas grid blocks with colors
  - When running in fullscreen you can pan the canvas by moving the mouse to the edge of the screen (not functional instide Weave yet until fullscreen permissions are enabled for applets)
# 0.1.2
  - Extracted most canvas UI-related states out of the main store
  - Added max zoom out button that zooms out and pans so that all frames are visible simuntaneously
  - Adjust max zoom out so that all frames can be visible simultaneosly on the maximum zoom out
  - Added optimization so only frames in the viewport are rendered
  - Added optimization so assets are not loaded when far out of the zoom level
  - Make it so frames cannot be overlapped
  - The resize handles are now zoom-level adapted and disabled during very far zoom out
  - At <=0.5 zoom frames turn into move-only mode and you can just drag them from anywhere
  - Fixed grid not rendering on first app start
  - Added new frame controls that are hidden and show at the edge of the frame when hovering (only at >0.5 zoom)
# 0.1.1
  - Fixed a bug that caused syncing between peers not to work
  - You can now add frames to pocket and embed instances of Substrate that are centered around that Frame
  - You can now remove linked assets from frames
  - Added provision to prevent inifinite recursion from happening when embedding Substrate within Substrate
  - Refactored store so it can be initialized outside the UI components structure
  - Made the canvas (0,0) position be at the center of the screen
  - Made shadows all share the same z-index so they don't overlap
  - Added provision to disable pointer events on iframes while dragging so the panning doesn't get stuck
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
  curationListOriginalUrl:
    "https://github.com/lightningrodlabs/weave-tool-curation/",
  curationListForkUrl: "https://github.com/Zequez/weave-tool-curation",
  tags: ["substrate", "canvas", "grid", "embedding", "assemblage"],
});
