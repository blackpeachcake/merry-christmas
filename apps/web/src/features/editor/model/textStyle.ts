import type { TextBg } from "./types";

export function isLightColor(hex: string): boolean {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  // YIQ 밝기
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150;
}

/** 인스타 "A" 버튼 스타일 → 글자색과 박스색 */
export function textStyle(color: string, textBg: TextBg): { fill: string; box: string | null } {
  const light = isLightColor(color);
  switch (textBg) {
    case "none":
      return { fill: color, box: null };
    case "solid":
      return { fill: light ? "#000000" : "#FFFFFF", box: color };
    case "translucent":
      return { fill: color, box: light ? "rgba(0, 0, 0, 0.45)" : "rgba(255, 255, 255, 0.6)" };
  }
}
