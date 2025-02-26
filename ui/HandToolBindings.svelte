<!-- <script lang="ts">
  import { onMount } from "svelte";

  // Binds to
  // - Spacebar-left-drag while in any tool
  // - Left-drag while main is Hand Tool
  // - Right-drag while alt is Hand Tool
  // - Middle-drag while on any tool



  const {
    onDragWithMainBtn,
    onDragWithLeftBtn,
    onDoubleClick,
    onEdgeTouched,
    onClick
    children,
    boundTo
  }: {
    onPan: (x: number, y: number) => void;
    children?: any,
    boundTo: { [key in "space-main" | "main" | "alt" | "middle"]: boolean };
  } = $props();

  class DragStream {
    dx: number;
    dy: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;

    onUpdate(cb: (x: number, y: number) => void) {

    }

    onCancel(cb: () => void) {

    }
  }
  // What Key is it bound to?
  // Middle click while on any tool
  // Left click while in pan tool
  // Spacebar-being-down and then left-click while in any tool
  // What does it provides?
  // - The X/Y delta of the mouse while dragging
  // - The X/Y position of the mouse while dragging
  // const mouseDown =
  // function handleEvents(cmd: ['k', KeyboardEvent, 'up' | 'down'] | ['m', MouseEvent, 'up' | 'down']) {

  // }
  // function handleEvents(ev: 'space-main' | 'main' | 'alt' | 'middle') {

  // }

  onMount(() => {
    if (boundTo['main'] || boundTo['alt']) {

    }
  })

  function bindToWindowEvents(listeners: {
    mdown: (ev: MouseEvent) => void;
    mup: (ev: MouseEvent) => void;
    kdown: (ev: KeyboardEvent) => void;
    kup: (ev: KeyboardEvent) => void;
  }) {
    onMount(() => {
      window.addEventListener("mousedown", listeners.mdown);
      window.addEventListener("mouseup", listeners.mup);
      window.addEventListener("keydown", listeners.kdown);
      window.addEventListener("keyup", listeners.kup);
    });
  }

  onMount(() => {
    function Mdown() {}

    function Mup() {}

    function Kup() {}

    function Kdown() {}
  });

  function handlePanningRelatedEvents(...cmd: ['mdown'] | ['mup'] | ['kdown'] | ['kup']) {

  }
</script>

<div
  class="size-full absolute"
  onmousedown={(ev) => handleEvents}
  onmouseup={(ev) => handleEvents}
  onkeydown={(ev) => handleEvents}
  onkeyup={(ev) => handleEvents}
>
  {@render children?.()}
</div>

<svelte:window
  onmouseup={() => {}}
  onmousedown={() => {}}
  onkeydown={() => {}}
  onkeyup={() => {}}
/> -->
