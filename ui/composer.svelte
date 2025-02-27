<script lang="ts">
  import SS from "@stores/main.svelte";

  import SpaceViewContainer from "./canvas/SpaceView.svelte";

  import GridDisplay from "./canvas/special-effects/GridDisplay.svelte";

  import TrashBinHud from "./hud/TrashBin.svelte";
  import PeopleHud from "./hud/People.svelte";
  import ToolsHud from "./hud/Tools.svelte";
  import ViewHud from "./hud/View.svelte";

  import GridBox from "./canvas/special-effects/GridBox.svelte";
  import Frame from "./canvas/frames/Frame.svelte";

  import WASDSpeedControl from "./WASDSpeedControl";
  import { cx, freezeDocumentSelectability } from "@center/snippets";
  import type { Pos } from "@stores/space.svelte";

  const props: { depth?: number; parentPos?: Pos; style?: string } = $props();

  SS.createStoreContext({ depth: props.depth || 0 });
  const S = SS.store;

  $effect(() => freezeDocumentSelectability(S.dragState.type !== "none"));

  WASDSpeedControl((direction, distance) => {
    S.cmd("move-towards", direction, distance);
  });
</script>

<!-- Experimental -->

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->
<!-- <BunchNavigation /> -->

<!-- <div
  class="absolute bg-black rounded-md z-1000 text-white top-0 right-0 px1 text-xs font-mono"
  style={`transform: translate(${-S.vp.renderedWidth + S.mouse.clientX}px, ${S.mouse.clientY - 20}px)`}
>
  {S.mouse.gridX}, {S.mouse.gridY}
</div> -->

<div
  class={cx("bg-[hsl(83,_53%,_27%)] size-full relative size-full", {})}
  style={`${props.style || ""};`}
>
  <!-- <div class="absolute top-0 left-0 bg-black text-white z-1000">
    {JSON.stringify(S.pos)}
  </div> -->
  <!-- HUD -->
  {#if !S.expandedFrame}
    <ToolsHud
      onClickTool={(tool, boundTo) => S.cmd("set-tool-to", tool, boundTo)}
    />
  {/if}
  {#if props.depth === 0}
    <PeopleHud />
  {/if}
  <TrashBinHud
    onMouseMove={S.ev.mousemove("trash")}
    onMouseUp={S.ev.mouseup("trash")}
    show={S.dragState.type === "movingFrames"}
    opened={S.dragState.type === "movingFrames" && S.dragState.trashing}
  />
  <ViewHud depth={props.depth || 0} />

  <!-- SPECIAL EFFECts -->

  {#if !S.expandedFrame}
    <GridDisplay pos={S.pos} vp={S.vp} size={S.grid.size} color="#fff" />
  {/if}

  <!-- CANVAS -->

  <!-- Note: Not transformed and z-index is unset -->
  <SpaceViewContainer
    onViewportChange={(vp) => S.cmd("set-viewport", vp)}
    parentPos={props.parentPos || { x: 0, y: 0, z: 1 }}
  >
    <!-- <GridBox box={{ h: 10, w: 10, x: 0, y: 0 }} cx="bg-white" /> -->

    {#if S.dragState.type === "selecting"}
      <GridBox
        box={S.dragState.boxNormalized}
        cx={"bg-[hsl(215,_70%,_57%)]/40 b-1 b-[hsl(215,_80%,_65%)] z-selection-box"}
      />
    {/if}

    {#if S.dragState.type === "creatingFrame"}
      <GridBox
        box={S.dragState.boxNormalized}
        cx={[
          {
            "bg-gray-100 b-black/10": S.dragState.isValid,
            "bg-gray-100/50 b-black/10": !S.dragState.isValid,
          },
        ]}
      />
    {/if}

    <!-- ALL THE CREATED FRAMES -->
    {#each S.viewportFrames as wrappedFrame (wrappedFrame.uuid)}
      <Frame {wrappedFrame} />
    {/each}
  </SpaceViewContainer>
</div>
