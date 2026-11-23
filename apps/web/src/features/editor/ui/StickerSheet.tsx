"use client";

import { type ClipboardEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { imageFromPasteEvent, readClipboardImage } from "../media/clipboard";
import { type LoadedImage, loadImageFile } from "../media/loadImage";
import { BottomSheet } from "./BottomSheet";

const NO_IMAGE = "복사된 이미지가 없어요";
const LONG_PRESS_HINT = "아래 칸을 길게 눌러 [붙여넣기]를 눌러 주세요";

export function StickerSheet({
  open,
  onClose,
  onPicked,
}: {
  open: boolean;
  onClose(): void;
  onPicked(image: LoadedImage): void;
}) {
  const [loading, setLoading] = useState(false);
  const pasteZoneRef = useRef<HTMLDivElement | null>(null);

  async function load(blob: Blob) {
    setLoading(true);
    try {
      onPicked(await loadImageFile(blob));
    } catch {
      toast.error("이미지를 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }

  /** [붙여넣기] 버튼: 클립보드 API(https 필요). 막히면 붙여넣기 칸으로 안내한다. */
  async function handlePasteButton() {
    const result = await readClipboardImage();
    if (result.ok) {
      await load(result.blob);
      return;
    }
    if (result.reason === "empty") {
      toast.error(NO_IMAGE);
      return;
    }
    toast.error(LONG_PRESS_HINT);
    pasteZoneRef.current?.focus();
  }

  /**
   * 붙여넣기 칸: 휴대폰 기본 메뉴의 [붙여넣기]로 들어온 이미지를 받는다.
   * paste 이벤트는 http 접속·인앱 브라우저에서도 동작한다.
   */
  function handlePasteZone(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = imageFromPasteEvent(event);
    if (!file) {
      toast.error(NO_IMAGE);
      return;
    }
    void load(file);
  }

  return (
    <BottomSheet open={open} title="스티커 추가" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex h-16 cursor-pointer items-center justify-center rounded-xl bg-neutral-800 text-sm font-semibold">
          앨범에서 고르기
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void load(file);
            }}
          />
        </label>
        <button
          className="h-16 rounded-xl bg-neutral-800 text-sm font-semibold disabled:opacity-50"
          disabled={loading}
          onClick={() => void handlePasteButton()}
        >
          붙여넣기
        </button>
      </div>
      <div
        ref={pasteZoneRef}
        role="textbox"
        aria-label="붙여넣기 칸"
        contentEditable
        suppressContentEditableWarning
        // 키보드 없이 길게 누르기 메뉴만 띄운다.
        inputMode="none"
        onPaste={handlePasteZone}
        // 글자 입력은 막는다(붙여넣기만 받는다).
        onBeforeInput={(e) => e.preventDefault()}
        className="mt-3 flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-white/30 px-4 text-center text-sm text-neutral-300 caret-transparent outline-none focus:border-white/70"
      >
        누끼 딴 이미지를 복사했다면
        <br />
        여기를 길게 눌러 [붙여넣기]
      </div>
      {loading && <p className="mt-3 text-center text-sm text-neutral-400">불러오는 중…</p>}
    </BottomSheet>
  );
}
