<script lang="ts">
  import SS from "@stores/main.svelte";

  const S = SS.store;
</script>

<canvas
  class="h-full w-full absolute top-0 left-0 z-grid pointer-events-none"
  bind:this={S.grid.el}
></canvas>
