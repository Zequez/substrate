<script lang="ts">
  import TrashIcon from "~icons/fa6-solid/trash";
  import cx from "classnames";
  import { fade } from "svelte/transition";

  const {
    onMouseMove,
    onMouseUp,
    show,
    opened,
  }: {
    onMouseMove: (ev: MouseEvent) => void;
    onMouseUp: (ev: MouseEvent) => void;
    show: boolean;
    opened: boolean;
  } = $props();
</script>

{#if show}
  <button
    transition:fade={{ duration: 100 }}
    class={cx(
      "h-20 w-20 z-100 absolute top-4 left-1/2 shadow-lg rounded-full -transform-x-1/2 absolute"
    )}
    onmousemove={onMouseMove}
    onmouseup={onMouseUp}
  >
    <div
      class={cx(
        "flexcc bg-red-500 b-2 b-black/5 relative z-20 text-white transition-transform transform-origin-top-right transition-duration-200 text-2xl h-full w-full rounded-full ",
        {
          "scale-85! translate-x-[5px] -translate-y-[5px] skew-x-[8deg] skew-y-[8deg]":
            opened,
        }
      )}
    >
      <TrashIcon />
    </div>
    <div
      class={cx(
        "h-full w-full absolute z-10 top-0 left-0 bg-gray-800 b-2 b-white/10 rounded-full"
      )}
    ></div>
  </button>
{/if}
