import type { Background, FontId, Ratio, Size, TextDraft } from "./types";

export const RATIO_OPTIONS: { ratio: Ratio; label: string }[] = [
  { ratio: "9:16", label: "9:16 스토리" },
  { ratio: "4:5", label: "4:5 세로" },
  { ratio: "1:1", label: "1:1 정사각형" },
  { ratio: "16:9", label: "16:9 가로" },
];

export const CANVAS_SIZE: Record<Ratio, Size> = {
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

export const FONT_IDS: FontId[] = [
  "pretendard",
  "gowun-batang",
  "jua",
  "black-han-sans",
  "nanum-pen",
];

export const COLOR_PALETTE = [
  "#FFFFFF",
  "#000000",
  "#E53935",
  "#FB8C00",
  "#FDD835",
  "#43A047",
  "#1E88E5",
  "#8E24AA",
  "#F48FB1",
  "#8D6E63",
];

export const DEFAULT_BACKGROUND: Background = { type: "color", color: "#1E3A5F" };

export const DEFAULT_TEXT_DRAFT: TextDraft = {
  text: "",
  fontId: "pretendard",
  fontSize: 96,
  color: "#FFFFFF",
  align: "center",
  textBg: "none",
};

export const FONT_SIZE_RANGE = { min: 32, max: 200 } as const;

export const HISTORY_LIMIT = 50;
/** 중앙 스냅 거리(논리 px) */
export const SNAP_DISTANCE = 24;
/** 0° 회전 스냅 각도 */
export const ROTATION_SNAP_DEG = 5;
/** 스티커 초기 크기: 캔버스 짧은 변 대비 */
export const STICKER_INITIAL_RATIO = 0.5;
export const MAX_IMAGE_EDGE = 2048;
export const SCALE_BOUNDS = { min: 0.1, max: 10 } as const;
/** 이 시간(ms) 이상 누르면 탭이 아니라 꾹 누르기(휴대폰 붙여넣기 메뉴)로 본다 */
export const LONG_PRESS_MS = 450;
