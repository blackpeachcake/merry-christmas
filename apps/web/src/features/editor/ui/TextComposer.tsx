"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { FONTS } from "../media/fonts";
import { COLOR_PALETTE, FONT_IDS, FONT_SIZE_RANGE } from "../model/constants";
import { textStyle } from "../model/textStyle";
import type { TextAlign, TextBg, TextDraft } from "../model/types";

const ALIGN_NEXT: Record<TextAlign, TextAlign> = { left: "center", center: "right", right: "left" };
const ALIGN_LABEL: Record<TextAlign, string> = { left: "왼쪽", center: "가운데", right: "오른쪽" };
const BG_NEXT: Record<TextBg, TextBg> = {
  none: "solid",
  solid: "translucent",
  translucent: "none",
};
const BG_LABEL: Record<TextBg, string> = {
  none: "없음",
  solid: "꽉 찬 박스",
  translucent: "반투명 박스",
};

/** iOS 키보드가 올라오면 보이는 영역 높이에 맞춘다. */
function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setHeight(viewport.height);
    update();
    viewport.addEventListener("resize", update);
    return () => viewport.removeEventListener("resize", update);
  }, []);
  return height;
}

export function TextComposer({
  initial,
  onDone,
}: {
  initial: TextDraft;
  onDone(draft: TextDraft): void;
}) {
  const [draft, setDraft] = useState<TextDraft>(initial);
  const viewportHeight = useVisualViewportHeight();
  const style = textStyle(draft.color, draft.textBg);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 커서는 항상 입력 칸에 둔다. 포커스가 버튼으로 옮겨가면 휴대폰은 키보드가 내려가고,
  // macOS 이모지 선택 창 등에서 넣은 문자가 들어갈 곳이 없어진다.
  const refocus = () => textareaRef.current?.focus();
  const set = (patch: Partial<TextDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    refocus();
  };
  // 버튼·빈 영역을 누르는 순간 포커스를 빼앗지 않게 한다(슬라이더와 입력 칸은 제외).
  const keepFocus = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      target === textareaRef.current ||
      (target instanceof HTMLInputElement && target.type === "range")
    ) {
      return;
    }
    event.preventDefault();
  };

  return (
    <div
      role="dialog"
      aria-label="텍스트 편집"
      className="fixed inset-x-0 top-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      style={{ height: viewportHeight ?? "100dvh" }}
      onMouseDown={keepFocus}
    >
      <div className="flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex gap-2">
          <button
            aria-label={`정렬: ${ALIGN_LABEL[draft.align]}`}
            className="rounded-full bg-white/15 px-3 py-2 text-sm"
            onClick={() => set({ align: ALIGN_NEXT[draft.align] })}
          >
            {ALIGN_LABEL[draft.align]}
          </button>
          <button
            aria-label={`글자 배경: ${BG_LABEL[draft.textBg]}`}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-bold",
              draft.textBg === "none" ? "bg-white/15" : "bg-white text-black",
            )}
            onClick={() => set({ textBg: BG_NEXT[draft.textBg] })}
          >
            A
          </button>
        </div>
        <button
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          onClick={() => onDone(draft)}
        >
          완료
        </button>
      </div>

      <div className="flex flex-1 items-center gap-2 overflow-hidden px-3">
        <input
          type="range"
          aria-label="글자 크기"
          min={FONT_SIZE_RANGE.min}
          max={FONT_SIZE_RANGE.max}
          value={draft.fontSize}
          onChange={(e) => setDraft((d) => ({ ...d, fontSize: Number(e.target.value) }))}
          onPointerUp={refocus}
          className="h-48 w-6 [direction:rtl] [writing-mode:vertical-lr]"
        />
        <div className="flex flex-1 justify-center">
          <textarea
            ref={textareaRef}
            aria-label="텍스트 입력"
            autoFocus
            rows={3}
            value={draft.text}
            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
            className="w-full resize-none rounded-lg bg-transparent p-2 outline-none"
            style={{
              fontFamily: FONTS[draft.fontId].family,
              // 화면용 미리보기 크기: 논리 크기의 1/3
              fontSize: draft.fontSize / 3,
              lineHeight: 1.2,
              textAlign: draft.align,
              color: style.fill,
              backgroundColor: style.box ?? "transparent",
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {FONT_IDS.map((id) => (
            <button
              key={id}
              aria-pressed={draft.fontId === id}
              onClick={() => set({ fontId: id })}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm",
                draft.fontId === id ? "border-white bg-white text-black" : "border-white/40",
              )}
              style={{ fontFamily: FONTS[id].family }}
            >
              {FONTS[id].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              aria-label={`색 ${color}`}
              aria-pressed={draft.color === color}
              onClick={() => set({ color })}
              className={cn(
                "size-8 shrink-0 rounded-full border-2",
                draft.color === color ? "border-white" : "border-white/30",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
