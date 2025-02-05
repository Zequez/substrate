import { type HoloHash } from "@holochain/client";

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
