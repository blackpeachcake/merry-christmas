"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { readClipboardImage } from "../media/clipboard";
import { type LoadedImage, loadImageFile } from "../media/loadImage";
import { BottomSheet } from "./BottomSheet";

const PASTE_ERROR = {
  unsupported: "이 환경에서는 붙여넣기가 안 돼요. 앨범에서 골라 주세요",
  denied: "이 환경에서는 붙여넣기가 안 돼요. 앨범에서 골라 주세요",
  empty: "복사된 이미지가 없어요",
} as const;

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
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  async function handlePaste() {
    const result = await readClipboardImage();
    if (result.ok) {
      await load(result.blob);
      return;
    }
    toast.error(PASTE_ERROR[result.reason]);
    if (result.reason !== "empty") fileRef.current?.click();
  }

  return (
    <BottomSheet open={open} title="스티커 추가" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl bg-neutral-800 text-sm font-semibold">
          앨범에서 고르기
          <input
            ref={fileRef}
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
          onClick={() => void handlePaste()}
        >
          붙여넣기
        </button>
      </div>
      {loading && <p className="mt-3 text-center text-sm text-neutral-400">불러오는 중…</p>}
    </BottomSheet>
  );
}
