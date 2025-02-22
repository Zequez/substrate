<script lang="ts">
  import { isWithinBox, type Box } from "@center/Frame";
  import {
    type Pixel,
    type PixelsFlat,
    PALLETTE,
    encodeXY,
  } from "@stores/spaceColoring.svelte";
  const {
    pixels,
    buffer,
    pos: gc,
    gridSize,
    selecting,
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
    selecting: PixelsFlat[] | null;
  } = $props();

  let el = $state<HTMLCanvasElement>();
  let ctx = $state<CanvasRenderingContext2D>(null!);

  // $effect(() => {
  //   console.log("PIXELS", pixels);
  // });

  $effect(() => {
    ctx = el!.getContext("2d")!;
  });

  $effect(() => {
    el!.width = gc.w;
    el!.height = gc.h;
  });

  const selectedPixelsMatcher = $derived(
    selecting ? selecting.map(([x, y]) => encodeXY(x, y)) : []
  );

  function paintPixels(pxls: PixelsFlat[], clear: boolean) {
    const m = gc.z > 0.25 ? 2 : 0;
    if (ctx) {
      if (clear) {
        ctx.clearRect(0, 0, gc.w, gc.h);
        bufferPainted = [];
      }
      const pixelSize = gridSize * gc.z;
      pxls.forEach(([x, y, color]) => {
        const palletteColor = PALLETTE[color];
        const func = palletteColor ? "fillRect" : "clearRect";
        if (palletteColor) {
          ctx.fillStyle = palletteColor;
        }
        const run = (f: any) => {
          ctx[f as "fillRect"](
            gc.x * pixelSize + x * pixelSize + gc.w / 2 + m / 2,
            gc.y * pixelSize + y * pixelSize + gc.h / 2 + m / 2,
            pixelSize - m,
            pixelSize - m
          );
        };
        run(func);

        if (func === "fillRect") {
          const selected =
            selecting && palletteColor
              ? selectedPixelsMatcher.indexOf(encodeXY(x, y)) !== -1
              : false;
          if (selected) {
            ctx.fillStyle = "rgba(0, 0, 255, 0.50)";
            // ctx.strokeStyle = "rgba(0, 0, 255, 0.9)";
            // ctx.lineWidth = 2;
            // ctx.strokeRect
            run("fillRect");
          }
        }
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
