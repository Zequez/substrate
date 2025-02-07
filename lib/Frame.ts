export type AssetUrl = string;

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type BoxResizeHandles = "l" | "r" | "b" | "t" | "tr" | "br" | "tl" | "bl";

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

// Turn a box with negative dimensional values to positive w and h values

export function normalizeBox(box: Box): Box {
  if (box.w > 0 && box.h > 0) return box;
  const x = box.w > 0 ? box.x : box.x + box.w + 1;
  const y = box.h > 0 ? box.y : box.y + box.h + 1;
  const w = Math.abs(box.w);
  const h = Math.abs(box.h);
  return { x, y, w, h };
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

export function containingBox(boxes: Box[]): Box | null {
  if (boxes.length === 0) return null;

  let tl: number;
  let tr: number;
  let bl: number;
  let br: number;

  boxes.forEach((b) => {
    if (b.x < tl || tl === undefined) tl = b.x;
    if (b.y < tr || tr === undefined) tr = b.y;
    if (b.x + b.w > br || br === undefined) br = b.x + b.w;
    if (b.y + b.h > bl || bl === undefined) bl = b.y + b.h;
  });

  return {
    x: tl!,
    y: tr!,
    w: br! - tl!,
    h: bl! - tr!,
  };
}

export function isTouching(box1: Box, box2: Box) {
  return (
    box1.x < box2.x + box2.w &&
    box1.x + box1.w > box2.x &&
    box1.y < box2.y + box2.h &&
    box1.y + box1.h > box2.y
  );
}

export function resizeBox(
  resizeHandle: BoxResizeHandles,
  box: Box,
  deltaX: number,
  deltaY: number
) {
  switch (resizeHandle) {
    case "l":
      return {
        ...box,
        x: Math.min(box.x + deltaX, box.x + box.w - 2),
        w: Math.max(2, box.w - deltaX),
      };
    case "r":
      return {
        ...box,
        w: Math.max(2, box.w + deltaX),
      };
    case "t":
      return {
        ...box,
        y: Math.min(box.y + deltaY, box.y + box.h - 2),
        h: Math.max(2, box.h - deltaY),
      };
    case "b":
      return {
        ...box,
        h: Math.max(2, box.h + deltaY),
      };
    case "br":
      return {
        ...box,
        h: Math.max(2, box.h + deltaY),
        w: Math.max(2, box.w + deltaX),
      };
    case "tl":
      return {
        ...box,
        y: Math.min(box.y + deltaY, box.y + box.h - 2),
        h: Math.max(2, box.h - deltaY),
        x: Math.min(box.x + deltaX, box.x + box.w - 2),
        w: Math.max(2, box.w - deltaX),
      };
    case "tr":
      return {
        ...box,
        y: Math.min(box.y + deltaY, box.y + box.h - 2),
        h: Math.max(2, box.h - deltaY),
        w: Math.max(2, box.w + deltaX),
      };
    case "bl":
      return {
        ...box,
        h: Math.max(2, box.h + deltaY),
        x: Math.min(box.x + deltaX, box.x + box.w - 2),
        w: Math.max(2, box.w - deltaX),
      };
  }
}
