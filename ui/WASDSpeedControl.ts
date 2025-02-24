export default function WASDSpeedControl(
  ev: (angle: number, distance: number) => void
) {
  let keys = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  const TICK = 25;

  let speed = 0;
  let direction = 0;
  let speedingTimeout: any;

  function onWASDChange() {
    clearTimeout(speedingTimeout);

    let x = 0;
    let y = 0;
    if (keys.up) y += 1;
    if (keys.down) y -= 1;
    if (keys.left) x -= 1;
    if (keys.right) x += 1;

    if (!x && !y) {
      speed = 0;
    } else {
      speed = 10;
      if (x === 0 && y === 1)
        direction = 1; // UP
      else if (x === 1 && y === 0)
        direction = 0.25; // RIGHT
      else if (x === -1 && y === 0)
        direction = 0.75; // LEFT
      else if (x === 0 && y === -1)
        direction = 0.5; // DOWN
      else if (x === 1 && y === 1)
        direction = 0.125; // TOP-RIGHT
      else if (x === 1 && y === -1)
        direction = 0.375; // BOTTOM-RIGHT
      else if (x === -1 && y === -1)
        direction = 0.625; // BOTTOM-LEFT
      else if (x === -1 && y === 1)
        direction = 0.875; // TOP-LEFT
      else direction = 0;
    }

    function startMovingTone() {
      if (speed) {
        ev(direction, speed);
        speedingTimeout = setTimeout(startMovingTone, TICK);
      }
    }

    startMovingTone();
  }

  function handleKeyDown(ev: KeyboardEvent) {
    if (ev.code === "KeyS") {
      keys.down = true;
    } else if (ev.code === "KeyW") {
      keys.up = true;
    } else if (ev.code === "KeyA") {
      keys.left = true;
    } else if (ev.code === "KeyD") {
      keys.right = true;
    }
    onWASDChange();
  }

  function handleKeyUp(ev: KeyboardEvent) {
    if (ev.code === "KeyS") {
      keys.down = false;
    } else if (ev.code === "KeyW") {
      keys.up = false;
    } else if (ev.code === "KeyA") {
      keys.left = false;
    } else if (ev.code === "KeyD") {
      keys.right = false;
    }
    onWASDChange();
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}
