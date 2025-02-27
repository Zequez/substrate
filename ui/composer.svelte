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
  import { freezeDocumentSelectability } from "@center/snippets";

  const { depth = 0 }: { depth: number } = $props();

  SS.createStoreContext({ depth });
  const S = SS.store;

  $effect(() => freezeDocumentSelectability(S.dragState.type !== "none"));

  WASDSpeedControl((direction, distance) => {
    S.cmd("move-towards", direction, distance);
  });

  $effect(() => {
    console.log("VIEWPORT CHANG", S.vp);
  });
</script>

<!-- Experimental -->

<!-- <GenericDnaInspector /> -->
<!-- <GenericDnaSandbox H={genericZomeClient} /> -->
<!-- <BunchNavigation /> -->

<main class="bg-[hsl(83,_53%,_27%)] size-full">
  <!-- HUD -->
  <ToolsHud
    onClickTool={(tool, boundTo) => S.cmd("set-tool-to", tool, boundTo)}
  />
  <PeopleHud />
  <TrashBinHud
    onMouseMove={S.ev.mousemove("trash")}
    onMouseUp={S.ev.mouseup("trash")}
    show={S.dragState.type === "movingFrames"}
    opened={S.dragState.type === "movingFrames" && S.dragState.trashing}
  />
  <ViewHud />

  <!-- SPECIAL EFFECts -->

  <GridDisplay
    x={S.pos.x}
    y={S.pos.y}
    z={S.pos.z}
    w={S.vp.width}
    h={S.vp.height}
    units={S.grid.size}
    color="#fff"
  />

  <!-- CANVAS -->

  <!-- Note: Not transformed and z-index is unset -->
  <SpaceViewContainer onViewportChange={(vp) => S.cmd("set-viewport", vp)}>
    <!-- <GridBox box={{ h: 10, w: 10, x: 0, y: 0 }} visual="bg-white" /> -->

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
</main>
