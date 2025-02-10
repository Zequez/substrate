import { type HoloHash } from "@holochain/client";
import classnames from "classnames";

export const relativeTimeFormat = (date: Date | number): string => {
  if (typeof date === "number") {
    date = new Date(date);
  }
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diff < minute) {
    return rtf.format(-Math.round(diff / second), "seconds");
  } else if (diff < hour) {
    return rtf.format(-Math.round(diff / minute), "minutes");
  } else if (diff < day) {
    return rtf.format(-Math.round(diff / hour), "hours");
  } else if (diff < day * 2) {
    return "Yesterday";
  } else if (diff < day * 7) {
    return rtf.format(-Math.round(diff / day), "days");
  } else if (diff < day * 30) {
    return rtf.format(-Math.round(diff / (day * 7)), "weeks");
  } else if (diff < day * 365) {
    return rtf.format(-Math.round(diff / (day * 30)), "months");
  } else {
    return "More than a year ago";
  }
};

export function hashSlice(hash: string, num: number) {
  return `${hash.slice(0, num)}...${hash.slice(-num)}`;
}

export function hashEq(a: HoloHash, b: HoloHash) {
  return indexedDB.cmp(a, b) === 0;
}

export function maybeReadLS<T>(key: string, defaultValue: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key)!) as T) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function c(
  node: HTMLElement,
  classes: Array<string | { [key: string]: boolean } | null | undefined>
) {
  node.className = classnames(...classes);

  return {
    update(
      newClasses: Array<string | { [key: string]: boolean } | null | undefined>
    ) {
      node.className = classnames(...newClasses);
    },
  };
}

const oldStyles = new Map<HTMLElement, string>();
export function stickyStyle(node: HTMLElement, style: string) {
  let oldStyle = node.style.cssText;
  oldStyles.set(node, oldStyle);
  node.style.cssText = oldStyle + style;

  return {
    update(newStyle: string) {
      if (newStyle) {
        node.style.cssText = oldStyles.get(node) + newStyle;
      }
    },
  };
}

// Return all grid positions in between 2 positions on a line
export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): [number, number][] {
  const points: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
}

export function resolveScreenEdgePanning(
  edge: number,
  x: number,
  y: number,
  w: number,
  h: number
): [-1 | 0 | 1, -1 | 0 | 1] {
  if (x <= edge * 2 && y <= edge * 2) {
    return [1, 1];
  } else if (x >= w - edge * 2 && y <= edge * 2) {
    return [-1, 1];
  } else if (x <= edge * 2 && y >= h - edge * 2) {
    return [1, -1];
  } else if (x >= w - edge * 2 && y >= h - edge * 2) {
    return [-1, -1];
  } else if (x <= edge) {
    return [1, 0];
  } else if (x >= w - edge) {
    return [-1, 0];
  } else if (y <= edge) {
    return [0, 1];
  } else if (y >= h - edge) {
    return [0, -1];
  } else {
    return [0, 0];
  }
}
