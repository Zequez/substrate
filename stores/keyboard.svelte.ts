function createKeyboardStore(pan: (x: number, y: number) => void) {
  let keyboardMove = $state<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  function mountInit() {
    let keyboardMoveTimeout: any = null;
    function handleKeyboardMove() {
      let x = 0;
      let y = 0;
      if (keyboardMove.up) y += 1;
      if (keyboardMove.down) y -= 1;
      if (keyboardMove.left) x += 1;
      if (keyboardMove.right) x -= 1;
      if (x || y) {
        pan(x, y);
        keyboardMoveTimeout = setTimeout(handleKeyboardMove, 25);
      } else {
        keyboardMoveTimeout = null;
      }
    }

    window.addEventListener("keydown", (ev) => {
      if (ev.code === "KeyS") {
        keyboardMove.down = true;
      } else if (ev.code === "KeyW") {
        keyboardMove.up = true;
      } else if (ev.code === "KeyA") {
        keyboardMove.left = true;
      } else if (ev.code === "KeyD") {
        keyboardMove.right = true;
      }
      if (!keyboardMoveTimeout) handleKeyboardMove();
    });

    window.addEventListener("keyup", (ev) => {
      if (ev.code === "KeyS") {
        keyboardMove.down = false;
      } else if (ev.code === "KeyW") {
        keyboardMove.up = false;
      } else if (ev.code === "KeyA") {
        keyboardMove.left = false;
      } else if (ev.code === "KeyD") {
        keyboardMove.right = false;
      }
    });
  }

  return {
    mountInit,
  };
}

export default createKeyboardStore;
