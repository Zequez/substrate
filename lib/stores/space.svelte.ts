import { onMount } from "svelte";

// Values can be floating point numbers
type Viewport = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const gridSize = 30;

function createSpace() {
  let vpEl = $state<HTMLElement>(null!);
  // Values in px
  // Used to convert from px to grid units
  let canvas = $state({ x: 0, y: 0, w: 0, h: 0 });

  // let vp = $state({ x: 0, y: 0, wh: 1, z: 1 });
  // let w = $derived(screen.w / gridSize);
  // let h = $derived(screen.h / gridSize);

  // const screenToCanvas = (x: number, y: number) => {
  //   return {
  //     x: x - canvas.x,
  //     y: y - canvas.y,
  //   };
  // };

  // const canvasToScreen = (x: number, y: number) => {
  //   return {
  //     x: x + canvas.x,
  //     y: y + canvas.y,
  //   };
  // };

  onMount(() => {
    function readViewport() {
      const box = vpEl.getBoundingClientRect();
      screen = {
        x: box.left,
        y: box.top,
        w: box.width,
        h: box.height,
      };
    }
    window.addEventListener("resize", readViewport);
    readViewport();

    return () => {
      window.removeEventListener("resize", readViewport);
    };
  });
}
