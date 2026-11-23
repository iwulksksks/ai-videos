import type { CharColor, TimeOfDay } from "../../lib/story";

export const SKY: Record<TimeOfDay, { top: string; bottom: string; tint: string; light: string; ambient: number }> = {
  day: { top: "#5fb8ff", bottom: "#d9f1ff", tint: "rgba(255,244,214,0.10)", light: "#fff6d8", ambient: 1 },
  sunset: { top: "#5a3f8f", bottom: "#ffb27a", tint: "rgba(255,140,90,0.20)", light: "#ffc58a", ambient: 0.85 },
  night: { top: "#070d2b", bottom: "#2a3a78", tint: "rgba(40,60,160,0.14)", light: "#b9c8ff", ambient: 0.6 },
};

/** Darken (amt < 0) or lighten (amt > 0) a hex color. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const f = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  r = f(r);
  g = f(g);
  b = f(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Mix a scene color toward the time-of-day mood. */
export function tod(hex: string, time: TimeOfDay): string {
  if (time === "day") return hex;
  if (time === "sunset") return mix(hex, "#ff8a5c", 0.18);
  return mix(shade(hex, -0.45), "#2a3a8a", 0.35);
}

export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = ch(pa);
  const [r2, g2, b2] = ch(pb);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${((1 << 24) | (m(r1, r2) << 16) | (m(g1, g2) << 8) | m(b1, b2)).toString(16).slice(1)}`;
}

export const CHAR_COLORS: Record<CharColor, string> = {
  yellow: "#ffd23f",
  pink: "#ff8fc7",
  blue: "#4f9dff",
  green: "#5ccf6b",
  orange: "#ff9a3c",
  purple: "#a77bff",
  red: "#ff5a5a",
  teal: "#2ec4b6",
};

export function seeded(seed: number) {
  let s = seed >>> 0 || 7;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
