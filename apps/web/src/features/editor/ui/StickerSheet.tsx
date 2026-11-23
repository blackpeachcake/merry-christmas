"use client";

import { useState } from "react";
import { toast } from "sonner";
import { readClipboardImage } from "../media/clipboard";
import { type LoadedImage, loadImageFile } from "../media/loadImage";
import { BottomSheet } from "./BottomSheet";

const NO_IMAGE = "복사된 이미지가 없어요";
const LONG_PRESS_HINT = "캔버스를 꾹 눌러 [붙여넣기]를 눌러 주세요";

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

  /**
   * [붙여넣기] 버튼: 클립보드 API(https 필요).
   * 막힌 환경(http 접속·인앱 브라우저)에서는 시트를 닫고, 캔버스를 꾹 눌러
   * 휴대폰 기본 [붙여넣기]를 쓰도록 안내한다(CanvasPasteLayer).
   */
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
    onClose();
    toast.error(LONG_PRESS_HINT);
  }

  return (
    <BottomSheet open={open} title="스티커 추가" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl bg-neutral-800 text-sm font-semibold">
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
          className="h-20 rounded-xl bg-neutral-800 text-sm font-semibold disabled:opacity-50"
          disabled={loading}
          onClick={() => void handlePasteButton()}
        >
          붙여넣기
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-neutral-400">
        누끼 딴 이미지를 복사했다면 캔버스를 꾹 눌러 바로 붙여넣을 수 있어요
      </p>
      {loading && <p className="mt-2 text-center text-sm text-neutral-400">불러오는 중…</p>}
    </BottomSheet>
  );
}
