import { create } from "zustand";

export type Sheet = "background" | "sticker" | null;

interface UiState {
  /** 텍스트 입력 화면. blockId가 null이면 새 텍스트 */
  composer: { blockId: string | null } | null;
  sheet: Sheet;
  /** PC(마우스)에서 핸들을 보여줄 블록 */
  selectedId: string | null;
  dragging: boolean;
  overTrash: boolean;
  guides: { x: boolean; y: boolean };
  exporting: boolean;
  openComposer(blockId: string | null): void;
  closeComposer(): void;
  openSheet(sheet: Exclude<Sheet, null>): void;
  closeSheet(): void;
  select(id: string | null): void;
  setDragging(value: boolean): void;
  setOverTrash(value: boolean): void;
  setGuides(guides: { x: boolean; y: boolean }): void;
  setExporting(value: boolean): void;
  resetGesture(): void;
}

const NO_GUIDES = { x: false, y: false };

export const useUiStore = create<UiState>()((set) => ({
  composer: null,
  sheet: null,
  selectedId: null,
  dragging: false,
  overTrash: false,
  guides: NO_GUIDES,
  exporting: false,
  openComposer: (blockId) => set({ composer: { blockId }, sheet: null, selectedId: null }),
  closeComposer: () => set({ composer: null }),
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
  select: (selectedId) => set({ selectedId }),
  setDragging: (dragging) => set({ dragging }),
  setOverTrash: (overTrash) => set({ overTrash }),
  setGuides: (guides) => set({ guides }),
  setExporting: (exporting) => set({ exporting }),
  resetGesture: () => set({ dragging: false, overTrash: false, guides: NO_GUIDES }),
}));
