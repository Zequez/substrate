export type AssetUrl = string;

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BoxedFrame = {
  box: Box;
  assetUrl: string;
  split: Split;
};

export type SplitConfig = [number, "h" | "v"];
export type Split = [SplitConfig, SplitFrame] | null;

export type SplitFrame = {
  split: Split;
  assetUrl: string;
};

export const EXAMPLE: BoxedFrame = {
  box: { x: 3, y: 3, h: 12, w: 12 },
  assetUrl: "arsars",
  split: [
    [0.99, "v"],
    {
      assetUrl: "Potato",
      split: [[0.6, "h"], { assetUrl: "arsars", split: null }],
    },
  ],
};

export type ComputedFrame = {
  box: Box;
  assetUrl: string;
};

export function computeFrames(frame: BoxedFrame): ComputedFrame[] {
  const frames: ComputedFrame[] = [];
  if (frame.split) {
    const [[span, direction], splitFrame] = frame.split;
    if (direction === "v" && frame.box.w < 2)
      throw "Too little horizontal space";
    if (direction === "h" && frame.box.h < 2) throw "Too little vertical space";
    const box1 = {
      x: frame.box.x,
      y: frame.box.y,
      w: direction === "v" ? Math.round(span * frame.box.w) : frame.box.w,
      h: direction === "h" ? Math.round(span * frame.box.h) : frame.box.h,
    };
    if (direction === "v" && box1.w === frame.box.w) box1.w -= 1;
    if (direction === "h" && box1.h === frame.box.h) box1.h -= 1;
    frames.push({
      box: box1,
      assetUrl: frame.assetUrl,
    });
    const box2 = {
      x: frame.box.x + (direction === "v" ? box1.w : 0),
      y: frame.box.y + (direction === "h" ? box1.h : 0),
      w: direction === "v" ? frame.box.w - box1.w : frame.box.w,
      h: direction === "h" ? frame.box.h - box1.h : frame.box.h,
    };
    const nextBox: BoxedFrame = {
      box: box2,
      assetUrl: splitFrame.assetUrl,
      split: splitFrame.split,
    };
    frames.push(...computeFrames(nextBox));
  } else {
    frames.push({
      box: frame.box,
      assetUrl: frame.assetUrl,
    });
  }

  return frames;
}

// Turn a frame with negative dimensional values to positive w and h values
export function normalizeFrame(frame: BoxedFrame): BoxedFrame {
  if (frame.box.w > 0 && frame.box.h > 0) return frame;
  const x = frame.box.w > 0 ? frame.box.x : frame.box.x + frame.box.w + 1;
  const y = frame.box.h > 0 ? frame.box.y : frame.box.y + frame.box.h + 1;
  const w = Math.abs(frame.box.w);
  const h = Math.abs(frame.box.h);
  return { ...frame, box: { x, y, w, h } };
}

// Creates a 1x1 frame at the furthest point from the frame pin location (where the mouse is)
export function rollDownFrame(frame: BoxedFrame): BoxedFrame {
  return {
    ...frame,
    box: {
      x: frame.box.x + frame.box.w + (frame.box.w < 0 ? 1 : -1),
      y: frame.box.y + frame.box.h + (frame.box.h < 0 ? 1 : -1),
      w: 1,
      h: 1,
    },
  };
}
