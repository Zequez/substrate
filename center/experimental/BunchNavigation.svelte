<!-- <script lang="ts">
  import SS from "../lib/stores/main.svelte";

  const S = SS.store;

  const boxesWithCenters: [string, [number, number]][] = $derived(
    Object.values(S.frames).map((f) => [
      f.uuid,
      [f.value.box.x + f.value.box.w / 2, f.value.box.y + f.value.box.h / 2],
    ])
  );

  const visualization = $derived.by(() => {
    function getSortedByDistanceToCenter(
      cx: number,
      cy: number,
      skip: string[]
    ): [string, number][] {
      if (boxesWithCenters.length === 0) return [];

      return (
        boxesWithCenters.map(([uuid, [x, y]]) => {
          const nx = x - cx;
          const ny = y - cy;
          return [uuid, nx * nx + ny * ny];
        }) as [string, number][]
      ).sort(([_1, d1], [_2, d2]) => {
        return d1 - d2;
      });
    }

    function getSortedByClosestNext() {
      const first = getSortedByDistanceToCenter(0, 0, [])[0];
      const result: [string, number][] = [];
      boxesWithCenters.forEach(([uuid, [x, y], i]) => {
        if (i === 0) {
          const first = getSortedByDistanceToCenter(0, 0, [])[0];
          result.push([first[0], 0] as [string, number])
        } else {
          const cx =
          const next = getSortedByDistanceToCenter(0, 0, [])[0];
        }
      })
    }

    const sortedByDistanceToCenter = getSortedByDistanceToCenter(
      S.pos.x,
      S.pos.y,
      []
    );

    // const closest = sortedByDistanceToCenter[0];
    return sortedByDistanceToCenter;
  });
</script>

<div
  class="absolute bg-gray-300 bottom-2 left-2 z-hud b b-black/10 rounded-md h20 w120 text-xs"
>
  {#each visualization.map(([uuid, dist]) => `${uuid} - ${dist}`) as frame}
    <div>{frame}</div>
  {/each}
</div> -->
