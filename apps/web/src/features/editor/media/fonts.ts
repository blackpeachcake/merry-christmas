import { Black_Han_Sans, Gowun_Batang, Jua, Nanum_Pen_Script } from "next/font/google";
import localFont from "next/font/local";
import type { Block, FontId } from "../model/types";

// 한글은 preload하지 않고 쓰는 글자만 그때 받는다 — docs/decisions/0001-korean-font-loading.md
const pretendard = localFont({
  src: "./PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  preload: false,
});
const gowunBatang = Gowun_Batang({ weight: "400", subsets: ["latin"], display: "swap" });
const jua = Jua({ weight: "400", subsets: ["latin"], display: "swap" });
const blackHanSans = Black_Han_Sans({ weight: "400", subsets: ["latin"], display: "swap" });
const nanumPen = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

export const FONTS: Record<FontId, { label: string; family: string }> = {
  pretendard: { label: "기본", family: pretendard.style.fontFamily },
  "gowun-batang": { label: "명조", family: gowunBatang.style.fontFamily },
  jua: { label: "동글", family: jua.style.fontFamily },
  "black-han-sans": { label: "굵게", family: blackHanSans.style.fontFamily },
  "nanum-pen": { label: "손글씨", family: nanumPen.style.fontFamily },
};

/** 텍스트 블록의 실제 글자로 필요한 폰트 조각을 불러온다. 실패해도 그리기는 계속한다. */
export async function ensureFontsLoaded(blocks: Block[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const loads = blocks.flatMap((block) =>
    block.type === "text"
      ? [document.fonts.load(`40px ${FONTS[block.fontId].family}`, block.text)]
      : [],
  );
  await Promise.allSettled(loads);
}
