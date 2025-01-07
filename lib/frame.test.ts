import { type BoxedFrame, computeFrames } from "./Frame";

export const EXAMPLE: BoxedFrame = {
  box: { x: 3, y: 3, h: 12, w: 12 },
  assetUrl: "arsars",
  split: [
    [4, "v"],
    {
      assetUrl: "Potato",
      split: null,
    },
  ],
};

expect(computeFrames(EXAMPLE)).toEq([
  {
    box: { x: 3, y: 3, h: 4, w: 12 },
    assetUrl: "arsars",
  },
  {
    box: { x: 3, y: 7, h: 8, w: 12 },
    assetUrl: "Potato",
  },
]);
