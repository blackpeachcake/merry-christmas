"use client";

import type { Background } from "../model/types";
import { BackgroundPicker } from "./BackgroundPicker";
import { BottomSheet } from "./BottomSheet";

export function BackgroundSheet({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  value: Background;
  onClose(): void;
  onChange(background: Background): void;
}) {
  return (
    <BottomSheet open={open} title="배경" onClose={onClose}>
      <BackgroundPicker value={value} onChange={onChange} />
    </BottomSheet>
  );
}
