"use client";

import type { ReactNode } from "react";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button aria-label="닫기" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <section
        role="dialog"
        aria-label={title}
        className="relative rounded-t-2xl bg-neutral-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <h2 className="mb-4 text-base font-semibold">{title}</h2>
        {children}
      </section>
    </div>
  );
}
