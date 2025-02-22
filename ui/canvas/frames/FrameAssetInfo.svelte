<script lang="ts">
  import { type AssetData } from "@stores/assets.svelte";
  import SS from "@stores/main.svelte";

  const S = SS.store;

  const { asset }: { asset: AssetData } = $props();
</script>

<div
  class="absolute overflow-hidden p-[10%] top-0 z-30 left-0 h-full size-full flexcc opacity-75 select-none"
>
  <div class="flexcc flex-wrap">
    <img
      src={asset.info.icon_src}
      alt={asset.info.name}
      style={`width: ${2 / S.pos.z}rem; height: ${2 / S.pos.z}rem`}
    />
    <div
      class="text-center"
      style={`font-size: ${1 / S.pos.z}rem; margin: 0 ${0.25 / S.pos.z}rem`}
    >
      {asset.info.name}
    </div>
  </div>
</div>
