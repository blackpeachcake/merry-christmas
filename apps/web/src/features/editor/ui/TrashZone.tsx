"use client";

import type { Ref } from "react";
import { cn } from "@/lib/cn";

export function TrashZone({
  visible,
  active,
  ref,
}: {
  visible: boolean;
  active: boolean;
  ref: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex size-14 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white/70 bg-black/40 text-2xl transition-transform",
        !visible && "invisible",
        active && "scale-125 bg-red-500/80",
      )}
    >
      🗑
    </div>
  );
}
