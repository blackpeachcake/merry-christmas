export type Ratio = "9:16" | "4:5" | "1:1" | "16:9";

export type Background = { type: "color"; color: string } | { type: "image"; src: string };

export type FontId = "pretendard" | "gowun-batang" | "jua" | "black-han-sans" | "nanum-pen";
export type TextAlign = "left" | "center" | "right";
/** 인스타 "A" 버튼: 글자 뒤 박스 없음 / 꽉 찬 박스 / 반투명 박스 */
export type TextBg = "none" | "solid" | "translucent";

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

interface BlockBase {
  id: string;
  /** 요소 중심, 논리 좌표 */
  x: number;
  y: number;
  /** 도(degree) */
  rotation: number;
  scale: number;
}

export interface TextBlock extends BlockBase {
  type: "text";
  text: string;
  fontId: FontId;
  /** 배율 1일 때 글자 크기(논리 px) */
  fontSize: number;
  color: string;
  align: TextAlign;
  textBg: TextBg;
}

export interface StickerBlock extends BlockBase {
  type: "sticker";
  /** 1단계: data URL */
  src: string;
  width: number;
  height: number;
}

export type Block = TextBlock | StickerBlock;

/** 텍스트 입력 화면에서 편집하는 값 */
export type TextDraft = Pick<
  TextBlock,
  "text" | "fontId" | "fontSize" | "color" | "align" | "textBg"
>;

export interface EditorSnapshot {
  ratio: Ratio;
  background: Background;
  /** order 순서(앞 = 맨 아래) */
  blocks: Block[];
}
