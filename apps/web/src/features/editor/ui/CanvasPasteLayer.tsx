"use client";

import { type ClipboardEvent, useEffect, useRef } from "react";
import { toast } from "sonner";
import { imageFromPasteEvent } from "../media/clipboard";

/**
 * 터치 기기에서 캔버스를 꾹 눌러 휴대폰 기본 [붙여넣기] 메뉴를 띄우기 위한 투명 층.
 *
 * - 기본 메뉴는 편집 가능한 요소에서만 뜨므로 contentEditable로 둔다.
 * - inputMode="none"으로 키보드는 띄우지 않고, 글자 입력은 막는다.
 * - 이미지 붙여넣기는 막지 않고 위로 올려 보내 EditorScreen의 붙여넣기 처리가 받는다.
 * - 제스처는 이 층의 부모(캔버스 영역)가 받고, 블록은 좌표로 찾으므로 이 층이 가려도 된다.
 */
export function CanvasPasteLayer() {
  const ref = useRef<HTMLDivElement | null>(null);

  // React의 onBeforeInput은 브라우저의 beforeinput을 받지 않으므로 직접 연결한다.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const block = (event: Event) => event.preventDefault();
    element.addEventListener("beforeinput", block);
    return () => element.removeEventListener("beforeinput", block);
  }, []);

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (imageFromPasteEvent(event)) return;
    event.preventDefault();
    toast.error("복사된 이미지가 없어요");
  }

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label="캔버스 붙여넣기"
      contentEditable
      suppressContentEditableWarning
      inputMode="none"
      onPaste={handlePaste}
      className="absolute inset-0 z-10 text-transparent caret-transparent outline-none select-text [-webkit-touch-callout:default]"
    />
  );
}
