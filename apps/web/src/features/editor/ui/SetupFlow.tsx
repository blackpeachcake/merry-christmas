"use client";

import { useState } from "react";
import { DEFAULT_BACKGROUND, RATIO_OPTIONS } from "../model/constants";
import type { Background, Ratio } from "../model/types";
import { BackgroundPicker } from "./BackgroundPicker";

export function SetupFlow({
  onComplete,
}: {
  onComplete(ratio: Ratio, background: Background): void;
}) {
  const [ratio, setRatio] = useState<Ratio | null>(null);
  const [background, setBackground] = useState<Background>(DEFAULT_BACKGROUND);

  if (ratio === null) {
    return (
      <section className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <h1 className="text-xl font-bold">비율을 골라 주세요</h1>
        <div className="grid grid-cols-2 gap-3">
          {RATIO_OPTIONS.map((option) => (
            <button
              key={option.ratio}
              onClick={() => setRatio(option.ratio)}
              className="flex h-28 items-center justify-center rounded-xl bg-neutral-800 text-sm font-semibold"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <button onClick={() => setRatio(null)} className="self-start text-sm text-neutral-400">
        비율 다시 고르기
      </button>
      <h1 className="text-xl font-bold">배경을 골라 주세요</h1>
      <div
        className="mx-auto h-48 rounded-lg border border-white/10 bg-cover bg-center"
        style={{
          aspectRatio: ratio.replace(":", " / "),
          ...(background.type === "color"
            ? { backgroundColor: background.color }
            : { backgroundImage: `url(${background.src})` }),
        }}
      />
      <BackgroundPicker value={background} onChange={setBackground} />
      <button
        onClick={() => onComplete(ratio, background)}
        className="rounded-xl bg-white py-3 font-semibold text-neutral-900"
      >
        시작하기
      </button>
    </section>
  );
}
