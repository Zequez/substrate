import { type BoxedFrame, computeFrames } from "./Frame";
import { it, expect } from "vitest";

const EXAMPLE: BoxedFrame = {
  box: { x: 3, y: 3, h: 12, w: 12 },
  assetUrl: "arsars",
  split: [
    [0.5, "h"],
    {
      assetUrl: "Potato",
      split: [
        [0.25, "v"],
        {
          assetUrl: "Foo",
          split: null,
        },
      ],
    },
  ],
};

it("should compute the final frames", () => {
  expect(computeFrames(EXAMPLE)).toEqual([
    {
      box: { x: 3, y: 3, h: 6, w: 12 },
      assetUrl: "arsars",
    },
    {
      box: { x: 3, y: 9, h: 6, w: 3 },
      assetUrl: "Potato",
    },
    {
      box: { x: 6, y: 9, h: 6, w: 9 },
      assetUrl: "Foo",
    },
  ]);
});
