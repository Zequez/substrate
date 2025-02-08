<script lang="ts">
  import {
    type PixelsFlat,
    PALLETTE,
    encodeXY,
  } from "../lib/stores/AgentColorPixels.svelte";
  const {
    pixels,
    buffer,
    pos: gc,
    gridSize,
  }: {
    pixels: PixelsFlat[];
    buffer: PixelsFlat[];
    pos: {
      w: number;
      h: number;
      x: number;
      y: number;
      z: number;
    };
    gridSize: number;
  } = $props();

  let el = $state<HTMLCanvasElement>();
  let ctx = $state<CanvasRenderingContext2D>(null!);

  $effect(() => {
    console.log("Setting context");
    ctx = el!.getContext("2d")!;
  });

  $effect(() => {
    console.log("Setting width");
    el!.width = gc.w;
    el!.height = gc.h;
  });

  function paintPixels(pxls: PixelsFlat[], clear: boolean) {
    const m = gc.z > 0.25 ? 2 : 0;
    if (ctx) {
      if (clear) {
        ctx.clearRect(0, 0, gc.w, gc.h);
        bufferPainted = [];
      }
      const pixelSize = gridSize * gc.z;
      ctx.fillStyle = "red";
      ctx.fillRect(gc.x * pixelSize, gc.y * pixelSize, 10, 10);
      pxls.forEach(([x, y, color]) => {
        const palletteColor = PALLETTE[color];
        const func = palletteColor ? "fillRect" : "clearRect";
        if (palletteColor) {
          ctx.fillStyle = palletteColor;
        }
        ctx[func](
          gc.x * pixelSize + x * pixelSize + gc.w / 2 + m / 2,
          gc.y * pixelSize + y * pixelSize + gc.h / 2 + m / 2,
          pixelSize - m,
          pixelSize - m
        );
      });
    }
  }

  $effect(() => {
    paintPixels(pixels, true);
  });

  let bufferPainted: string[] = [];
  $effect(() => {
    let bufferToPaint = buffer.filter((p) => {
      const xy = encodeXY(p[0], p[1]);
      if (bufferPainted.indexOf(xy) === -1) {
        bufferPainted.push(xy);
        return true;
      } else {
        return false;
      }
    });
    if (bufferToPaint.length) {
      paintPixels(bufferToPaint, false);
    }
  });
</script>

<!-- Z one below the grid -->
<canvas class="size-full absolute z-5 pointer-events-none" bind:this={el}>
</canvas>
