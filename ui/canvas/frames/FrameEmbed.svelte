<script lang="ts">
  import clients from "@center/clients";
  import { hashEq } from "@center/snippets/utils";

  import { type AssetData } from "@stores/assets.svelte";
  import SS from "@stores/main.svelte";

  const S = SS.store;

  const { asset }: { asset: AssetData } = $props();

  let loaded = $state(false);
  function handleLoadIframe() {
    loaded = true;
  }

  const isSubstrateAsset = $derived(hashEq(asset.wal.hrl[0], clients.dnaHash));
</script>

{#if isSubstrateAsset && clients.wal}
  Substrate embed; preventing recursion
{:else}
  <iframe
    title="Asset"
    class="absolute top-0 z-30 left-0 h-full w-full"
    src={asset.iframeSrc}
    style={S.ui.boxBorderRadius}
    onload={handleLoadIframe}
  ></iframe>
  {#if !loaded}
    <div
      style={S.ui.boxBorderRadius}
      class="absolute inset-0 z-40 bg-gray-200 flexcc"
    >
      Loading...
    </div>
  {/if}
{/if}
