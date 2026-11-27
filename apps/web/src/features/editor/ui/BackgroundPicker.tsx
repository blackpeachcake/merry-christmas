"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { loadImageFile } from "../media/loadImage";
import { COLOR_PALETTE } from "../model/constants";
import type { Background } from "../model/types";

type Tab = "color" | "image";

export function BackgroundPicker({
  value,
  onChange,
}: {
  value: Background;
  onChange(background: Background): void;
}) {
  const [tab, setTab] = useState<Tab>(value.type);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    try {
      const image = await loadImageFile(file);
      onChange({ type: "image", src: image.src });
    } catch {
      toast.error("이미지를 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="grid grid-cols-2 rounded-lg bg-neutral-800 p-1 text-sm">
        {(["color", "image"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("rounded-md py-2", tab === t && "bg-neutral-600 font-semibold")}
          >
            {t === "color" ? "단색" : "사진"}
          </button>
        ))}
      </div>

      {tab === "color" ? (
        <div className="flex flex-wrap gap-3">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              aria-label={color}
              aria-pressed={value.type === "color" && value.color === color}
              onClick={() => onChange({ type: "color", color })}
              className={cn(
                "size-10 rounded-full border-2 border-white/20",
                value.type === "color" &&
                  value.color === color &&
                  "ring-2 ring-white ring-offset-2 ring-offset-neutral-900",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <label className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-white/40 text-xs">
            <span className="sr-only">직접 고르기</span>+
            <input
              type="color"
              aria-label="직접 고르기"
              className="sr-only"
              onChange={(e) => onChange({ type: "color", color: e.target.value.toUpperCase() })}
            />
          </label>
        </div>
      ) : (
        <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/30 text-sm">
          {loading
            ? "불러오는 중…"
            : value.type === "image"
              ? "다른 사진 고르기"
              : "앨범에서 고르기"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );
}
