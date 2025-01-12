<script lang="ts">
  import { onMount } from "svelte";
  let mouseX: number = $state(0);
  let mouseY: number = $state(0);
  let x: number = $state(0);
  let y: number = $state(0);

  onMount(() => {
    window.addEventListener("mousemove", (ev) => {
      mouseX = ev.clientX;
      mouseY = ev.clientY;
    });
  });

  $effect(() => {
    // Ease into the mouse position
    x = lerp(x, mouseX, 0.1);
    y = lerp(y, mouseY, 0.1);
  });

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
</script>

<div
  class="absolute top-0 left-0"
  style={`transform: translateX(${x}px) translateY(${y}px);`}
>
  <div class="text-[200px] absolute top-0 left-0 translate-[-50%] z-100">
    😙
  </div>
</div>
