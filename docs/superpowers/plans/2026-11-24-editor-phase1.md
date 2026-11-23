# 에디터 실험 1단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/editor`에서 비율·배경을 고르고, 인스타 스토리처럼 텍스트·스티커를 제스처로 꾸민 뒤 PNG로 저장하는 혼자 쓰는 에디터를 만든다.

**Architecture:** 문서 상태는 Y.Doc(meta / blocks / order) 하나가 기준이고 IndexedDB에 저장한다. 모든 변경은 `model/operations.ts`를 거치며, 화면(react-konva)은 스냅샷을 읽어 그리기만 한다. 제스처 중에는 Konva 노드를 직접 움직이고 제스처가 끝날 때 한 번만 문서에 기록한다. 에디터는 `next/dynamic(ssr:false)`로 브라우저에서만 불러온다.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, react-konva 19 / konva 10, yjs 13.6, y-indexeddb 9, zustand 5, @use-gesture/react 10, browser-image-compression 2, sonner 2, Vitest 5 + Testing Library, Playwright 1.65

**Spec:** `docs/superpowers/specs/2026-11-24-editor-phase1-design.md` · **Issue:** #11 · **Branch:** `feature/11`

## Global Constraints

- 모든 명령은 레포 루트에서 실행한다. 웹 앱 명령은 `pnpm --filter web <script>`.
- Next.js 16.4는 학습 데이터와 다르다. Next API를 새로 쓰기 전에 `apps/web/node_modules/next/dist/docs/`의 해당 문서를 확인한다.
- `next/dynamic`의 `ssr: false`는 `"use client"` 파일 안에서만 쓴다.
- Konva·Yjs·IndexedDB·`next/font`를 import하는 모듈은 Vitest에서 직접 렌더하지 않는다(필요하면 `vi.mock`).
- 비율과 논리 캔버스 크기: `9:16`=1080×1920, `4:5`=1080×1350, `1:1`=1080×1080, `16:9`=1920×1080. 비율은 생성 후 변경 불가.
- 블록 좌표 `x`,`y`는 요소 **중심**, 논리 좌표. 크기는 `scale`(배율), 회전은 `rotation`(도).
- 실행 취소 기록은 메모리에만, 최근 **50**단계.
- 스티커 이미지: 긴 변 **2048px**, JPEG 입력만 JPEG로, 나머지는 PNG로(투명도 보존).
- 커밋 메시지: Conventional Commits, 한국어 제목, 끝에 `Refs #11`과 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 사용자에게 보이는 문구는 한국어 해요체.

## File Structure

```
apps/web/src/
  app/editor/
    page.tsx                  라우트(서버). metadata/viewport + EditorLoader
    editor-loader.tsx         "use client" + dynamic(ssr:false)
  features/editor/
    EditorRoot.tsx            문서 로드 → SetupFlow 또는 EditorScreen, Toaster
    EditorScreen.tsx          에디터 화면 조립(캔버스·상단 바·시트·입력 화면 연결)
    model/
      types.ts                Ratio, Background, FontId, Block, EditorSnapshot …
      constants.ts            CANVAS_SIZE, RATIO_OPTIONS, FONT_IDS, COLOR_PALETTE …
      doc.ts                  Y.Doc 키·origin, initDoc, clearDoc, readSnapshot
      operations.ts           addText, addSticker, updateBlock, bringToFront,
                              removeBlock, setBackground, commitTextDraft
      history.ts              createHistory (Y.UndoManager + 50단계 제한)
      geometry.ts             fitScale, snapToCenter, snapRotation, isInside,
                              applyPinch, coverRect, stickerInitialScale
      textStyle.ts            textBg에 따른 글자색·박스색 계산
    state/
      useEditorDoc.ts         Y.Doc + IndexedDB + history 수명 관리
      useDocSnapshot.ts       Y.Doc → React (useSyncExternalStore)
      useHistoryState.ts      canUndo / canRedo 구독
      uiStore.ts              zustand: composer, sheet, selectedId, dragging …
      useElementSize.ts       ResizeObserver
    media/
      PretendardVariable.woff2
      fonts.ts                next/font 5종 → FONTS, ensureFontsLoaded
      loadImage.ts            pickOutputType, loadImageFile, measureImage
      clipboard.ts            readClipboardImage, imageFromPasteEvent
    canvas/
      EditorStage.tsx         Stage·레이어·배경·블록·가이드·Transformer
      TextNode.tsx, StickerNode.tsx, useImageElement.ts
    gestures/
      useCanvasGestures.ts    드래그·핀치·탭 → operations
    ui/
      SetupFlow.tsx, BackgroundPicker.tsx, BottomSheet.tsx, TopBar.tsx,
      TrashZone.tsx, TextComposer.tsx, StickerSheet.tsx, BackgroundSheet.tsx
    export/
      exportPng.ts            exportStageToPng, saveImage
apps/web/e2e/editor.spec.ts
docs/experiments/editor-phase1.md
```

테스트 파일은 대상 파일 옆에 `*.test.ts(x)`로 둔다(`vitest.config.mts`의 `include: src/**/*.test.{ts,tsx}`).

---

### Task 1: 의존성 설치 + 모델 타입·상수·문서

**Files:**

- Modify: `apps/web/package.json` (의존성)
- Create: `apps/web/src/features/editor/model/types.ts`
- Create: `apps/web/src/features/editor/model/constants.ts`
- Create: `apps/web/src/features/editor/model/doc.ts`
- Test: `apps/web/src/features/editor/model/doc.test.ts`

**Interfaces:**

- Produces:
  - 타입: `Ratio`, `Background`, `FontId`, `TextAlign`, `TextBg`, `TextBlock`, `StickerBlock`, `Block`, `TextDraft`, `EditorSnapshot`, `Size`, `Point`
  - 상수: `RATIO_OPTIONS`, `CANVAS_SIZE`, `FONT_IDS`, `COLOR_PALETTE`, `DEFAULT_TEXT_DRAFT`, `DEFAULT_BACKGROUND`, `HISTORY_LIMIT`, `SNAP_DISTANCE`, `ROTATION_SNAP_DEG`, `STICKER_INITIAL_RATIO`, `MAX_IMAGE_EDGE`
  - `doc.ts`: `LOCAL_ORIGIN`, `SYSTEM_ORIGIN`, `createEditorDoc(): Y.Doc`, `getMeta(doc)`, `getBlocks(doc)`, `getOrder(doc)`, `initDoc(doc, ratio, background): void`, `clearDoc(doc): void`, `readSnapshot(doc): EditorSnapshot | null`

- [ ] **Step 1: 의존성 설치**

```bash
pnpm --filter web add konva@^10.10.0 react-konva@^19.3.2 yjs@^13.6.33 y-indexeddb@^9.0.12 zustand@^5.1.0 @use-gesture/react@^10.3.1 browser-image-compression@^2.0.2 sonner@^2.0.8
pnpm --filter web add -D pretendard@^1.3.9
```

Expected: `Done` 출력, `apps/web/package.json`에 위 패키지 추가.

- [ ] **Step 2: 타입 작성** — `model/types.ts`

```ts
export type Ratio = "9:16" | "4:5" | "1:1" | "16:9";

export type Background = { type: "color"; color: string } | { type: "image"; src: string };

export type FontId = "pretendard" | "gowun-batang" | "jua" | "black-han-sans" | "nanum-pen";
export type TextAlign = "left" | "center" | "right";
/** 인스타 "A" 버튼: 글자 뒤 박스 없음 / 꽉 찬 박스 / 반투명 박스 */
export type TextBg = "none" | "solid" | "translucent";

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

interface BlockBase {
  id: string;
  /** 요소 중심, 논리 좌표 */
  x: number;
  y: number;
  /** 도(degree) */
  rotation: number;
  scale: number;
}

export interface TextBlock extends BlockBase {
  type: "text";
  text: string;
  fontId: FontId;
  /** 배율 1일 때 글자 크기(논리 px) */
  fontSize: number;
  color: string;
  align: TextAlign;
  textBg: TextBg;
}

export interface StickerBlock extends BlockBase {
  type: "sticker";
  /** 1단계: data URL */
  src: string;
  width: number;
  height: number;
}

export type Block = TextBlock | StickerBlock;

/** 텍스트 입력 화면에서 편집하는 값 */
export type TextDraft = Pick<
  TextBlock,
  "text" | "fontId" | "fontSize" | "color" | "align" | "textBg"
>;

export interface EditorSnapshot {
  ratio: Ratio;
  background: Background;
  /** order 순서(앞 = 맨 아래) */
  blocks: Block[];
}
```

- [ ] **Step 3: 상수 작성** — `model/constants.ts`

```ts
import type { Background, FontId, Ratio, Size, TextDraft } from "./types";

export const RATIO_OPTIONS: { ratio: Ratio; label: string }[] = [
  { ratio: "9:16", label: "9:16 스토리" },
  { ratio: "4:5", label: "4:5 세로" },
  { ratio: "1:1", label: "1:1 정사각형" },
  { ratio: "16:9", label: "16:9 가로" },
];

export const CANVAS_SIZE: Record<Ratio, Size> = {
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

export const FONT_IDS: FontId[] = [
  "pretendard",
  "gowun-batang",
  "jua",
  "black-han-sans",
  "nanum-pen",
];

export const COLOR_PALETTE = [
  "#FFFFFF",
  "#000000",
  "#E53935",
  "#FB8C00",
  "#FDD835",
  "#43A047",
  "#1E88E5",
  "#8E24AA",
  "#F48FB1",
  "#8D6E63",
];

export const DEFAULT_BACKGROUND: Background = { type: "color", color: "#1E3A5F" };

export const DEFAULT_TEXT_DRAFT: TextDraft = {
  text: "",
  fontId: "pretendard",
  fontSize: 96,
  color: "#FFFFFF",
  align: "center",
  textBg: "none",
};

export const FONT_SIZE_RANGE = { min: 32, max: 200 } as const;

export const HISTORY_LIMIT = 50;
/** 중앙 스냅 거리(논리 px) */
export const SNAP_DISTANCE = 24;
/** 0° 회전 스냅 각도 */
export const ROTATION_SNAP_DEG = 5;
/** 스티커 초기 크기: 캔버스 짧은 변 대비 */
export const STICKER_INITIAL_RATIO = 0.5;
export const MAX_IMAGE_EDGE = 2048;
export const SCALE_BOUNDS = { min: 0.1, max: 10 } as const;
```

- [ ] **Step 4: 실패하는 테스트 작성** — `model/doc.test.ts`

```ts
import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { clearDoc, createEditorDoc, getBlocks, getOrder, initDoc, readSnapshot } from "./doc";

describe("doc", () => {
  it("초기화 전에는 스냅샷이 null이다", () => {
    expect(readSnapshot(createEditorDoc())).toBeNull();
  });

  it("initDoc 후 비율·배경이 담긴 빈 스냅샷을 돌려준다", () => {
    const doc = createEditorDoc();
    initDoc(doc, "9:16", { type: "color", color: "#000000" });
    expect(readSnapshot(doc)).toEqual({
      ratio: "9:16",
      background: { type: "color", color: "#000000" },
      blocks: [],
    });
  });

  it("블록은 order 순서대로 스냅샷에 담긴다", () => {
    const doc = createEditorDoc();
    initDoc(doc, "1:1", { type: "color", color: "#000000" });
    const a = new Y.Map<unknown>(
      Object.entries({
        id: "a",
        type: "sticker",
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        src: "s",
        width: 1,
        height: 1,
      }),
    );
    const b = new Y.Map<unknown>(
      Object.entries({
        id: "b",
        type: "sticker",
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        src: "s",
        width: 1,
        height: 1,
      }),
    );
    getBlocks(doc).set("a", a);
    getBlocks(doc).set("b", b);
    getOrder(doc).push(["b", "a"]);
    expect(readSnapshot(doc)?.blocks.map((block) => block.id)).toEqual(["b", "a"]);
  });

  it("clearDoc 후 다시 초기화 전 상태가 된다", () => {
    const doc = createEditorDoc();
    initDoc(doc, "1:1", { type: "color", color: "#000000" });
    getOrder(doc).push(["x"]);
    clearDoc(doc);
    expect(readSnapshot(doc)).toBeNull();
    expect(getOrder(doc).length).toBe(0);
  });
});
```

- [ ] **Step 5: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model/doc.test.ts`
Expected: FAIL — `Failed to resolve import "./doc"`

- [ ] **Step 6: 구현** — `model/doc.ts`

```ts
import * as Y from "yjs";
import type { Background, Block, EditorSnapshot, Ratio } from "./types";

/** 사용자 조작. 실행 취소 대상. */
export const LOCAL_ORIGIN = Symbol("local");
/** 초기화·새로 만들기. 실행 취소 대상 아님. */
export const SYSTEM_ORIGIN = Symbol("system");

const KEYS = { meta: "meta", blocks: "blocks", order: "order" } as const;

export function createEditorDoc(): Y.Doc {
  return new Y.Doc();
}

export const getMeta = (doc: Y.Doc) => doc.getMap<unknown>(KEYS.meta);
export const getBlocks = (doc: Y.Doc) => doc.getMap<Y.Map<unknown>>(KEYS.blocks);
export const getOrder = (doc: Y.Doc) => doc.getArray<string>(KEYS.order);

export function initDoc(doc: Y.Doc, ratio: Ratio, background: Background): void {
  doc.transact(() => {
    const meta = getMeta(doc);
    meta.set("ratio", ratio);
    meta.set("background", background);
  }, SYSTEM_ORIGIN);
}

export function clearDoc(doc: Y.Doc): void {
  doc.transact(() => {
    getMeta(doc).clear();
    getBlocks(doc).clear();
    const order = getOrder(doc);
    order.delete(0, order.length);
  }, SYSTEM_ORIGIN);
}

export function readSnapshot(doc: Y.Doc): EditorSnapshot | null {
  const meta = getMeta(doc);
  const ratio = meta.get("ratio") as Ratio | undefined;
  const background = meta.get("background") as Background | undefined;
  if (!ratio || !background) return null;

  const blockMaps = getBlocks(doc);
  const blocks: Block[] = [];
  for (const id of getOrder(doc).toArray()) {
    const map = blockMaps.get(id);
    if (map) blocks.push(map.toJSON() as Block);
  }
  return { ratio, background, blocks };
}
```

- [ ] **Step 7: 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model/doc.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 8: 커밋**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/src/features/editor/model
git commit -m "feat(web): 에디터 문서 모델(타입·상수·Y.Doc 초기화) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 문서 조작 함수 (operations)

**Files:**

- Create: `apps/web/src/features/editor/model/operations.ts`
- Test: `apps/web/src/features/editor/model/operations.test.ts`

**Interfaces:**

- Consumes: Task 1 `doc.ts`, `types.ts`, `constants.ts`
- Produces:
  - `addText(doc, fields: Omit<TextBlock, "id" | "type">): string`
  - `addSticker(doc, fields: Omit<StickerBlock, "id" | "type">): string`
  - `type BlockPatch = Partial<Omit<TextBlock, "id" | "type">> & Partial<Omit<StickerBlock, "id" | "type">>`
  - `updateBlock(doc, id: string, patch: BlockPatch, options?: { bringToFront?: boolean }): void`
  - `bringToFront(doc, id: string): void`
  - `removeBlock(doc, id: string): void`
  - `setBackground(doc, background: Background): void`
  - `commitTextDraft(doc, canvas: Size, blockId: string | null, draft: TextDraft): string | null` — 빈 내용이면 기존 블록 삭제 후 `null`, 새 텍스트면 중앙에 추가 후 id, 기존이면 수정 후 id
- 모든 변경은 `LOCAL_ORIGIN` 트랜잭션 하나로 실행한다(→ 실행 취소 1단계).

- [ ] **Step 1: 실패하는 테스트 작성** — `model/operations.test.ts`

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type * as Y from "yjs";
import { DEFAULT_TEXT_DRAFT } from "./constants";
import { createEditorDoc, initDoc, readSnapshot } from "./doc";
import {
  addSticker,
  addText,
  bringToFront,
  commitTextDraft,
  removeBlock,
  setBackground,
  updateBlock,
} from "./operations";

const textFields = { ...DEFAULT_TEXT_DRAFT, text: "안녕", x: 540, y: 960, rotation: 0, scale: 1 };
const stickerFields = {
  src: "data:image/png;base64,AA",
  width: 100,
  height: 50,
  x: 1,
  y: 2,
  rotation: 0,
  scale: 1,
};

let doc: Y.Doc;
const ids = () => readSnapshot(doc)?.blocks.map((block) => block.id);

beforeEach(() => {
  doc = createEditorDoc();
  initDoc(doc, "9:16", { type: "color", color: "#000000" });
});

describe("operations", () => {
  it("addText / addSticker는 맨 위에 블록을 추가하고 id를 돌려준다", () => {
    const t = addText(doc, textFields);
    const s = addSticker(doc, stickerFields);
    expect(ids()).toEqual([t, s]);
    expect(readSnapshot(doc)?.blocks[0]).toMatchObject({ id: t, type: "text", text: "안녕" });
    expect(readSnapshot(doc)?.blocks[1]).toMatchObject({ id: s, type: "sticker", width: 100 });
  });

  it("updateBlock은 필드만 바꾸고, bringToFront 옵션이면 맨 위로 올린다", () => {
    const a = addText(doc, textFields);
    const b = addSticker(doc, stickerFields);
    updateBlock(doc, a, { x: 10, scale: 2 }, { bringToFront: true });
    expect(ids()).toEqual([b, a]);
    expect(readSnapshot(doc)?.blocks[1]).toMatchObject({ x: 10, y: 960, scale: 2 });
  });

  it("bringToFront는 이미 맨 위면 순서를 바꾸지 않는다", () => {
    const a = addText(doc, textFields);
    const b = addText(doc, textFields);
    bringToFront(doc, b);
    expect(ids()).toEqual([a, b]);
    bringToFront(doc, a);
    expect(ids()).toEqual([b, a]);
  });

  it("removeBlock은 블록과 순서에서 모두 지운다", () => {
    const a = addText(doc, textFields);
    removeBlock(doc, a);
    expect(ids()).toEqual([]);
  });

  it("setBackground는 배경을 바꾼다", () => {
    setBackground(doc, { type: "image", src: "data:x" });
    expect(readSnapshot(doc)?.background).toEqual({ type: "image", src: "data:x" });
  });

  describe("commitTextDraft", () => {
    const canvas = { width: 1080, height: 1920 };

    it("새 텍스트는 캔버스 중앙, 배율 1, 회전 0으로 추가한다", () => {
      const id = commitTextDraft(doc, canvas, null, { ...DEFAULT_TEXT_DRAFT, text: "메리" });
      expect(readSnapshot(doc)?.blocks[0]).toMatchObject({
        id,
        x: 540,
        y: 960,
        scale: 1,
        rotation: 0,
        text: "메리",
      });
    });

    it("새 텍스트가 공백뿐이면 추가하지 않는다", () => {
      expect(
        commitTextDraft(doc, canvas, null, { ...DEFAULT_TEXT_DRAFT, text: "  \n " }),
      ).toBeNull();
      expect(ids()).toEqual([]);
    });

    it("기존 텍스트는 내용·스타일만 바꾸고 위치는 유지한다", () => {
      const id = addText(doc, { ...textFields, x: 100 });
      commitTextDraft(doc, canvas, id, { ...DEFAULT_TEXT_DRAFT, text: "수정", color: "#E53935" });
      expect(readSnapshot(doc)?.blocks[0]).toMatchObject({
        id,
        x: 100,
        text: "수정",
        color: "#E53935",
      });
    });

    it("기존 텍스트를 비우면 블록을 삭제한다", () => {
      const id = addText(doc, textFields);
      expect(commitTextDraft(doc, canvas, id, { ...DEFAULT_TEXT_DRAFT, text: "" })).toBeNull();
      expect(ids()).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model/operations.test.ts`
Expected: FAIL — `Failed to resolve import "./operations"`

- [ ] **Step 3: 구현** — `model/operations.ts`

```ts
import * as Y from "yjs";
import { getBlocks, getMeta, getOrder, LOCAL_ORIGIN } from "./doc";
import type { Background, Block, Size, StickerBlock, TextBlock, TextDraft } from "./types";

export type BlockPatch = Partial<Omit<TextBlock, "id" | "type">> &
  Partial<Omit<StickerBlock, "id" | "type">>;

const newId = () => crypto.randomUUID();

function insertBlock(doc: Y.Doc, block: Block): void {
  doc.transact(() => {
    const map = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(block)) map.set(key, value);
    getBlocks(doc).set(block.id, map);
    getOrder(doc).push([block.id]);
  }, LOCAL_ORIGIN);
}

function moveToEnd(doc: Y.Doc, id: string): void {
  const order = getOrder(doc);
  const index = order.toArray().indexOf(id);
  if (index === -1 || index === order.length - 1) return;
  order.delete(index, 1);
  order.push([id]);
}

export function addText(doc: Y.Doc, fields: Omit<TextBlock, "id" | "type">): string {
  const block: TextBlock = { id: newId(), type: "text", ...fields };
  insertBlock(doc, block);
  return block.id;
}

export function addSticker(doc: Y.Doc, fields: Omit<StickerBlock, "id" | "type">): string {
  const block: StickerBlock = { id: newId(), type: "sticker", ...fields };
  insertBlock(doc, block);
  return block.id;
}

export function updateBlock(
  doc: Y.Doc,
  id: string,
  patch: BlockPatch,
  options: { bringToFront?: boolean } = {},
): void {
  doc.transact(() => {
    const map = getBlocks(doc).get(id);
    if (!map) return;
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) map.set(key, value);
    }
    if (options.bringToFront) moveToEnd(doc, id);
  }, LOCAL_ORIGIN);
}

export function bringToFront(doc: Y.Doc, id: string): void {
  doc.transact(() => moveToEnd(doc, id), LOCAL_ORIGIN);
}

export function removeBlock(doc: Y.Doc, id: string): void {
  doc.transact(() => {
    getBlocks(doc).delete(id);
    const order = getOrder(doc);
    const index = order.toArray().indexOf(id);
    if (index !== -1) order.delete(index, 1);
  }, LOCAL_ORIGIN);
}

export function setBackground(doc: Y.Doc, background: Background): void {
  doc.transact(() => getMeta(doc).set("background", background), LOCAL_ORIGIN);
}

/**
 * 텍스트 입력 화면의 [완료] 처리.
 * - 내용이 비면: 기존 블록은 삭제, 새 텍스트는 추가하지 않음 → null
 * - 새 텍스트: 캔버스 중앙·배율 1·회전 0으로 추가 → id
 * - 기존 텍스트: 내용·스타일만 수정 → id
 */
export function commitTextDraft(
  doc: Y.Doc,
  canvas: Size,
  blockId: string | null,
  draft: TextDraft,
): string | null {
  const empty = draft.text.trim() === "";
  if (blockId === null) {
    if (empty) return null;
    return addText(doc, {
      ...draft,
      x: canvas.width / 2,
      y: canvas.height / 2,
      rotation: 0,
      scale: 1,
    });
  }
  if (empty) {
    removeBlock(doc, blockId);
    return null;
  }
  updateBlock(doc, blockId, draft);
  return blockId;
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model/operations.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/features/editor/model/operations.ts apps/web/src/features/editor/model/operations.test.ts
git commit -m "feat(web): 에디터 문서 조작 함수(추가·수정·순서·삭제·배경·텍스트 확정) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 실행 취소 기록 (50단계 제한)

**Files:**

- Create: `apps/web/src/features/editor/model/history.ts`
- Test: `apps/web/src/features/editor/model/history.test.ts`

**Interfaces:**

- Consumes: Task 1 `doc.ts`, Task 2 `operations.ts`
- Produces: `createHistory(doc: Y.Doc, limit?: number): Y.UndoManager`
  - `LOCAL_ORIGIN` 트랜잭션만 추적한다(초기화·새로 만들기·IndexedDB 동기화는 제외).
  - `captureTimeout: 0` — 트랜잭션 하나가 곧 1단계. 제스처·입력 화면이 끝날 때 한 번만 기록하므로 묶음 단위가 자연스럽게 맞는다.

- [ ] **Step 1: 실패하는 테스트 작성** — `model/history.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT_DRAFT } from "./constants";
import { createEditorDoc, initDoc, readSnapshot } from "./doc";
import { createHistory } from "./history";
import { addText, setBackground, updateBlock } from "./operations";

const fields = { ...DEFAULT_TEXT_DRAFT, text: "a", x: 0, y: 0, rotation: 0, scale: 1 };

function setup(limit?: number) {
  const doc = createEditorDoc();
  initDoc(doc, "9:16", { type: "color", color: "#000000" });
  return { doc, history: createHistory(doc, limit) };
}

describe("createHistory", () => {
  it("초기화는 되돌리지 않는다", () => {
    const { history } = setup();
    expect(history.canUndo()).toBe(false);
  });

  it("조작 하나가 실행 취소 한 단계다", () => {
    const { doc, history } = setup();
    const id = addText(doc, fields);
    updateBlock(doc, id, { x: 100 });
    history.undo();
    expect(readSnapshot(doc)?.blocks[0]).toMatchObject({ x: 0 });
    history.undo();
    expect(readSnapshot(doc)?.blocks).toEqual([]);
    history.redo();
    expect(readSnapshot(doc)?.blocks).toHaveLength(1);
  });

  it("배경 변경도 되돌린다", () => {
    const { doc, history } = setup();
    setBackground(doc, { type: "color", color: "#FFFFFF" });
    history.undo();
    expect(readSnapshot(doc)?.background).toEqual({ type: "color", color: "#000000" });
  });

  it("최근 limit 단계까지만 기억한다", () => {
    const { doc, history } = setup(3);
    const id = addText(doc, fields);
    for (let x = 1; x <= 5; x += 1) updateBlock(doc, id, { x });
    expect(history.undoStack).toHaveLength(3);
    history.undo();
    history.undo();
    history.undo();
    expect(history.canUndo()).toBe(false);
    expect(readSnapshot(doc)?.blocks[0]).toMatchObject({ x: 2 });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model/history.test.ts`
Expected: FAIL — `Failed to resolve import "./history"`

- [ ] **Step 3: 구현** — `model/history.ts`

```ts
import * as Y from "yjs";
import { HISTORY_LIMIT } from "./constants";
import { getBlocks, getMeta, getOrder, LOCAL_ORIGIN } from "./doc";

/**
 * 실행 취소 기록. 메모리에만 있고(새로고침하면 비워짐) 최근 limit 단계만 유지한다.
 * Y.UndoManager에 개수 옵션이 없어서 기록이 추가될 때 오래된 것부터 버린다.
 */
export function createHistory(doc: Y.Doc, limit: number = HISTORY_LIMIT): Y.UndoManager {
  const history = new Y.UndoManager([getMeta(doc), getBlocks(doc), getOrder(doc)], {
    trackedOrigins: new Set([LOCAL_ORIGIN]),
    captureTimeout: 0,
  });
  history.on("stack-item-added", () => {
    while (history.undoStack.length > limit) history.undoStack.shift();
  });
  return history;
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model/history.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/features/editor/model/history.ts apps/web/src/features/editor/model/history.test.ts
git commit -m "feat(web): 실행 취소 기록(내 조작만, 최근 50단계) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 계산 함수 (geometry, textStyle)

**Files:**

- Create: `apps/web/src/features/editor/model/geometry.ts`
- Create: `apps/web/src/features/editor/model/textStyle.ts`
- Test: `apps/web/src/features/editor/model/geometry.test.ts`
- Test: `apps/web/src/features/editor/model/textStyle.test.ts`

**Interfaces:**

- Consumes: Task 1 `types.ts`, `constants.ts`
- Produces (`geometry.ts`):
  - `fitScale(canvas: Size, viewport: Size): number`
  - `snapToCenter(pos: Point, canvas: Size, distance?: number): Point & { guideX: boolean; guideY: boolean }` — `guideX`는 세로 중앙선(x 정렬), `guideY`는 가로 중앙선
  - `normalizeDeg(deg: number): number` — (-180, 180]
  - `snapRotation(deg: number, threshold?: number): number`
  - `isInside(point: Point, rect: { left: number; top: number; right: number; bottom: number }, padding?: number): boolean`
  - `applyPinch(start: { scale: number; rotation: number }, movement: [number, number]): { scale: number; rotation: number }` — movement = [배율 비, 각도 변화(도)]
  - `coverRect(image: Size, box: Size): { x: number; y: number; width: number; height: number }`
  - `stickerInitialScale(image: Size, canvas: Size): number`
- Produces (`textStyle.ts`):
  - `isLightColor(hex: string): boolean`
  - `textStyle(color: string, textBg: TextBg): { fill: string; box: string | null }`

- [ ] **Step 1: 실패하는 테스트 작성** — `model/geometry.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  applyPinch,
  coverRect,
  fitScale,
  isInside,
  normalizeDeg,
  snapRotation,
  snapToCenter,
  stickerInitialScale,
} from "./geometry";

const canvas = { width: 1080, height: 1920 };

describe("geometry", () => {
  it("fitScale은 캔버스가 화면 안에 다 들어가는 배율이다", () => {
    expect(fitScale(canvas, { width: 360, height: 800 })).toBeCloseTo(1 / 3);
    expect(fitScale(canvas, { width: 1000, height: 960 })).toBeCloseTo(0.5);
  });

  it("snapToCenter는 중앙 근처면 달라붙고 가이드를 켠다", () => {
    expect(snapToCenter({ x: 530, y: 100 }, canvas, 24)).toEqual({
      x: 540,
      y: 100,
      guideX: true,
      guideY: false,
    });
    expect(snapToCenter({ x: 100, y: 975 }, canvas, 24)).toEqual({
      x: 100,
      y: 960,
      guideX: false,
      guideY: true,
    });
    expect(snapToCenter({ x: 500, y: 900 }, canvas, 24)).toEqual({
      x: 500,
      y: 900,
      guideX: false,
      guideY: false,
    });
  });

  it("normalizeDeg는 (-180, 180]로 맞춘다", () => {
    expect(normalizeDeg(370)).toBe(10);
    expect(normalizeDeg(-190)).toBe(170);
    expect(normalizeDeg(180)).toBe(180);
  });

  it("snapRotation은 0° 근처에서만 0으로 맞춘다", () => {
    expect(snapRotation(3, 5)).toBe(0);
    expect(snapRotation(-4, 5)).toBe(0);
    expect(snapRotation(363, 5)).toBe(0);
    expect(snapRotation(30, 5)).toBe(30);
  });

  it("isInside는 패딩만큼 넓힌 사각형으로 판정한다", () => {
    const rect = { left: 100, top: 100, right: 200, bottom: 200 };
    expect(isInside({ x: 150, y: 150 }, rect)).toBe(true);
    expect(isInside({ x: 90, y: 150 }, rect)).toBe(false);
    expect(isInside({ x: 90, y: 150 }, rect, 16)).toBe(true);
  });

  it("applyPinch는 시작 값에 배율을 곱하고 각도를 더하며, 배율 범위를 지킨다", () => {
    expect(applyPinch({ scale: 2, rotation: 10 }, [1.5, 20])).toEqual({ scale: 3, rotation: 30 });
    expect(applyPinch({ scale: 1, rotation: 0 }, [0.01, 0]).scale).toBe(0.1);
    expect(applyPinch({ scale: 5, rotation: 0 }, [5, 0]).scale).toBe(10);
  });

  it("coverRect는 박스를 꽉 채우도록 가운데 맞춘다", () => {
    expect(coverRect({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual({
      x: -50,
      y: 0,
      width: 200,
      height: 100,
    });
  });

  it("stickerInitialScale은 긴 변을 캔버스 짧은 변의 50%에 맞춘다", () => {
    expect(stickerInitialScale({ width: 1080, height: 540 }, canvas)).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 2: 실패하는 테스트 작성** — `model/textStyle.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { isLightColor, textStyle } from "./textStyle";

describe("textStyle", () => {
  it("isLightColor는 밝기로 판정한다", () => {
    expect(isLightColor("#FFFFFF")).toBe(true);
    expect(isLightColor("#FDD835")).toBe(true);
    expect(isLightColor("#000000")).toBe(false);
    expect(isLightColor("#1E88E5")).toBe(false);
  });

  it("none: 박스 없이 선택한 색 글자", () => {
    expect(textStyle("#E53935", "none")).toEqual({ fill: "#E53935", box: null });
  });

  it("solid: 선택한 색 박스 + 대비되는 글자색", () => {
    expect(textStyle("#FFFFFF", "solid")).toEqual({ fill: "#000000", box: "#FFFFFF" });
    expect(textStyle("#1E88E5", "solid")).toEqual({ fill: "#FFFFFF", box: "#1E88E5" });
  });

  it("translucent: 선택한 색 글자 + 반투명 대비 박스", () => {
    expect(textStyle("#FFFFFF", "translucent")).toEqual({
      fill: "#FFFFFF",
      box: "rgba(0, 0, 0, 0.45)",
    });
    expect(textStyle("#000000", "translucent")).toEqual({
      fill: "#000000",
      box: "rgba(255, 255, 255, 0.6)",
    });
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model/geometry.test.ts src/features/editor/model/textStyle.test.ts`
Expected: FAIL — `Failed to resolve import "./geometry"`, `"./textStyle"`

- [ ] **Step 4: 구현** — `model/geometry.ts`

```ts
import { ROTATION_SNAP_DEG, SCALE_BOUNDS, SNAP_DISTANCE, STICKER_INITIAL_RATIO } from "./constants";
import type { Point, Size } from "./types";

export function fitScale(canvas: Size, viewport: Size): number {
  return Math.min(viewport.width / canvas.width, viewport.height / canvas.height);
}

export function snapToCenter(
  pos: Point,
  canvas: Size,
  distance: number = SNAP_DISTANCE,
): Point & { guideX: boolean; guideY: boolean } {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const guideX = Math.abs(pos.x - cx) <= distance;
  const guideY = Math.abs(pos.y - cy) <= distance;
  return { x: guideX ? cx : pos.x, y: guideY ? cy : pos.y, guideX, guideY };
}

export function normalizeDeg(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

export function snapRotation(deg: number, threshold: number = ROTATION_SNAP_DEG): number {
  return Math.abs(normalizeDeg(deg)) <= threshold ? 0 : deg;
}

export function isInside(
  point: Point,
  rect: { left: number; top: number; right: number; bottom: number },
  padding = 0,
): boolean {
  return (
    point.x >= rect.left - padding &&
    point.x <= rect.right + padding &&
    point.y >= rect.top - padding &&
    point.y <= rect.bottom + padding
  );
}

export function applyPinch(
  start: { scale: number; rotation: number },
  movement: [number, number],
): { scale: number; rotation: number } {
  const [ratio, angle] = movement;
  const scale = Math.min(SCALE_BOUNDS.max, Math.max(SCALE_BOUNDS.min, start.scale * ratio));
  return { scale, rotation: start.rotation + angle };
}

export function coverRect(
  image: Size,
  box: Size,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.max(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (box.width - width) / 2, y: (box.height - height) / 2, width, height };
}

export function stickerInitialScale(image: Size, canvas: Size): number {
  const target = Math.min(canvas.width, canvas.height) * STICKER_INITIAL_RATIO;
  return target / Math.max(image.width, image.height);
}
```

- [ ] **Step 5: 구현** — `model/textStyle.ts`

```ts
import type { TextBg } from "./types";

export function isLightColor(hex: string): boolean {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  // YIQ 밝기
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150;
}

/** 인스타 "A" 버튼 스타일 → 글자색과 박스색 */
export function textStyle(color: string, textBg: TextBg): { fill: string; box: string | null } {
  const light = isLightColor(color);
  switch (textBg) {
    case "none":
      return { fill: color, box: null };
    case "solid":
      return { fill: light ? "#000000" : "#FFFFFF", box: color };
    case "translucent":
      return { fill: color, box: light ? "rgba(0, 0, 0, 0.45)" : "rgba(255, 255, 255, 0.6)" };
  }
}
```

- [ ] **Step 6: 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/model`
Expected: PASS (모든 model 테스트)

- [ ] **Step 7: 커밋**

```bash
git add apps/web/src/features/editor/model/geometry.ts apps/web/src/features/editor/model/geometry.test.ts apps/web/src/features/editor/model/textStyle.ts apps/web/src/features/editor/model/textStyle.test.ts
git commit -m "feat(web): 에디터 계산 함수(화면 맞춤·스냅·핀치·휴지통 판정·글자 스타일) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 상태 훅 (문서 수명·스냅샷·실행 취소 상태·UI 상태)

**Files:**

- Create: `apps/web/src/features/editor/state/useEditorDoc.ts`
- Create: `apps/web/src/features/editor/state/useDocSnapshot.ts`
- Create: `apps/web/src/features/editor/state/useHistoryState.ts`
- Create: `apps/web/src/features/editor/state/uiStore.ts`
- Create: `apps/web/src/features/editor/state/useElementSize.ts`
- Test: `apps/web/src/features/editor/state/useDocSnapshot.test.ts`
- Test: `apps/web/src/features/editor/state/useHistoryState.test.ts`

**Interfaces:**

- Consumes: Task 1~3 (`doc.ts`, `history.ts`, `operations.ts`)
- Produces:
  - `useEditorDoc(options?: { persist?: boolean; name?: string }): EditorDocHandle`
    - `interface EditorDocHandle { doc: Y.Doc; history: Y.UndoManager; status: "loading" | "ready"; persistent: boolean; reset(): void }`
  - `useDocSnapshot(doc: Y.Doc): EditorSnapshot | null`
  - `useHistoryState(history: Y.UndoManager): { canUndo: boolean; canRedo: boolean }`
  - `useUiStore` (zustand) — 상태: `composer: { blockId: string | null } | null`, `sheet: "background" | "sticker" | null`, `selectedId: string | null`, `dragging: boolean`, `overTrash: boolean`, `guides: { x: boolean; y: boolean }`, `exporting: boolean`; 액션: `openComposer(blockId: string | null)`, `closeComposer()`, `openSheet(sheet)`, `closeSheet()`, `select(id: string | null)`, `setDragging(v: boolean)`, `setOverTrash(v: boolean)`, `setGuides(g)`, `setExporting(v: boolean)`, `resetGesture()`
  - `useElementSize<T extends HTMLElement>(): [ref: (el: T | null) => void, size: Size]`

- [ ] **Step 1: 실패하는 테스트 작성** — `state/useDocSnapshot.test.ts`

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT_DRAFT } from "../model/constants";
import { createEditorDoc, initDoc } from "../model/doc";
import { addText } from "../model/operations";
import { useDocSnapshot } from "./useDocSnapshot";

describe("useDocSnapshot", () => {
  it("문서가 바뀌면 새 스냅샷으로 다시 렌더한다", () => {
    const doc = createEditorDoc();
    const { result } = renderHook(() => useDocSnapshot(doc));
    expect(result.current).toBeNull();

    act(() => initDoc(doc, "1:1", { type: "color", color: "#000000" }));
    expect(result.current?.ratio).toBe("1:1");

    act(() => {
      addText(doc, { ...DEFAULT_TEXT_DRAFT, text: "a", x: 0, y: 0, rotation: 0, scale: 1 });
    });
    expect(result.current?.blocks).toHaveLength(1);
  });

  it("문서가 그대로면 같은 스냅샷 객체를 돌려준다", () => {
    const doc = createEditorDoc();
    initDoc(doc, "1:1", { type: "color", color: "#000000" });
    const { result, rerender } = renderHook(() => useDocSnapshot(doc));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
```

- [ ] **Step 2: 실패하는 테스트 작성** — `state/useHistoryState.test.ts`

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT_DRAFT } from "../model/constants";
import { createEditorDoc, initDoc } from "../model/doc";
import { createHistory } from "../model/history";
import { addText } from "../model/operations";
import { useHistoryState } from "./useHistoryState";

describe("useHistoryState", () => {
  it("조작·실행 취소에 따라 canUndo/canRedo가 바뀐다", () => {
    const doc = createEditorDoc();
    initDoc(doc, "1:1", { type: "color", color: "#000000" });
    const history = createHistory(doc);
    const { result } = renderHook(() => useHistoryState(history));
    expect(result.current).toEqual({ canUndo: false, canRedo: false });

    act(() => {
      addText(doc, { ...DEFAULT_TEXT_DRAFT, text: "a", x: 0, y: 0, rotation: 0, scale: 1 });
    });
    expect(result.current).toEqual({ canUndo: true, canRedo: false });

    act(() => {
      history.undo();
    });
    expect(result.current).toEqual({ canUndo: false, canRedo: true });
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/state`
Expected: FAIL — `Failed to resolve import "./useDocSnapshot"`, `"./useHistoryState"`

- [ ] **Step 4: 구현** — `state/useDocSnapshot.ts`

```ts
import { useCallback, useRef, useSyncExternalStore } from "react";
import type * as Y from "yjs";
import { readSnapshot } from "../model/doc";
import type { EditorSnapshot } from "../model/types";

/** Y.Doc 변경을 React 렌더로 연결한다. 문서가 바뀔 때만 새 스냅샷을 만든다. */
export function useDocSnapshot(doc: Y.Doc): EditorSnapshot | null {
  const cache = useRef<{ snapshot: EditorSnapshot | null } | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = () => {
        cache.current = null;
        onChange();
      };
      doc.on("update", handler);
      return () => doc.off("update", handler);
    },
    [doc],
  );

  const getSnapshot = useCallback(() => {
    if (cache.current === null) cache.current = { snapshot: readSnapshot(doc) };
    return cache.current.snapshot;
  }, [doc]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

- [ ] **Step 5: 구현** — `state/useHistoryState.ts`

```ts
import { useCallback, useRef, useSyncExternalStore } from "react";
import type * as Y from "yjs";

type HistoryState = { canUndo: boolean; canRedo: boolean };
const EVENTS = ["stack-item-added", "stack-item-popped", "stack-cleared"] as const;

export function useHistoryState(history: Y.UndoManager): HistoryState {
  const cache = useRef<HistoryState>({ canUndo: false, canRedo: false });

  const subscribe = useCallback(
    (onChange: () => void) => {
      for (const event of EVENTS) history.on(event, onChange);
      return () => {
        for (const event of EVENTS) history.off(event, onChange);
      };
    },
    [history],
  );

  const getSnapshot = useCallback(() => {
    const next = { canUndo: history.canUndo(), canRedo: history.canRedo() };
    if (next.canUndo !== cache.current.canUndo || next.canRedo !== cache.current.canRedo) {
      cache.current = next;
    }
    return cache.current;
  }, [history]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

- [ ] **Step 6: 구현** — `state/useEditorDoc.ts`

```ts
import { useCallback, useEffect, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import type * as Y from "yjs";
import { clearDoc, createEditorDoc } from "../model/doc";
import { createHistory } from "../model/history";

export interface EditorDocHandle {
  doc: Y.Doc;
  history: Y.UndoManager;
  status: "loading" | "ready";
  /** false면 새로고침 시 작업이 사라진다(IndexedDB 사용 불가) */
  persistent: boolean;
  /** 새로 만들기: 문서와 실행 취소 기록을 비운다 */
  reset(): void;
}

const SYNC_TIMEOUT_MS = 3000;

export function useEditorDoc({
  persist = true,
  name = "merry-editor-phase1",
}: { persist?: boolean; name?: string } = {}): EditorDocHandle {
  const [doc] = useState(createEditorDoc);
  const [history] = useState(() => createHistory(doc));
  const [canPersist] = useState(() => persist && typeof indexedDB !== "undefined");
  const [status, setStatus] = useState<"loading" | "ready">(canPersist ? "loading" : "ready");
  const [persistent, setPersistent] = useState(canPersist);

  useEffect(() => {
    if (!canPersist) return;
    let cancelled = false;
    const provider = new IndexeddbPersistence(name, doc);
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setPersistent(false);
      setStatus("ready");
    }, SYNC_TIMEOUT_MS);

    provider.whenSynced.then(() => {
      if (cancelled) return;
      clearTimeout(timeout);
      setStatus("ready");
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      void provider.destroy();
    };
  }, [canPersist, doc, name]);

  const reset = useCallback(() => {
    clearDoc(doc);
    history.clear();
  }, [doc, history]);

  return { doc, history, status, persistent, reset };
}
```

- [ ] **Step 7: 구현** — `state/uiStore.ts`

```ts
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
```

- [ ] **Step 8: 구현** — `state/useElementSize.ts`

```ts
import { useCallback, useEffect, useState } from "react";
import type { Size } from "../model/types";

/** 요소 크기를 추적한다. 반환한 ref 콜백을 요소에 붙인다. */
export function useElementSize<T extends HTMLElement>(): [(el: T | null) => void, Size] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  const ref = useCallback((el: T | null) => setElement(el), []);
  return [ref, size];
}
```

- [ ] **Step 9: 통과 확인 + 타입 검사**

Run: `pnpm --filter web exec vitest run src/features/editor/state && pnpm --filter web typecheck`
Expected: PASS (3 tests), 타입 오류 없음

- [ ] **Step 10: 커밋**

```bash
git add apps/web/src/features/editor/state
git commit -m "feat(web): 에디터 상태 훅(IndexedDB 문서·스냅샷·실행 취소 상태·UI 상태) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 폰트·이미지·클립보드

**Files:**

- Create: `apps/web/src/features/editor/media/PretendardVariable.woff2` (복사)
- Create: `apps/web/src/features/editor/media/fonts.ts`
- Create: `apps/web/src/features/editor/media/loadImage.ts`
- Create: `apps/web/src/features/editor/media/clipboard.ts`
- Test: `apps/web/src/features/editor/media/loadImage.test.ts`
- Test: `apps/web/src/features/editor/media/clipboard.test.ts`

**Interfaces:**

- Consumes: Task 1 `types.ts`, `constants.ts`
- Produces:
  - `FONTS: Record<FontId, { label: string; family: string }>` — `family`는 Konva·CSS에 그대로 넣는 font-family 문자열
  - `ensureFontsLoaded(blocks: Block[]): Promise<void>` — 텍스트 블록의 실제 글자로 폰트 조각을 미리 불러온다
  - `pickOutputType(inputType: string): "image/jpeg" | "image/png"`
  - `interface LoadedImage { src: string; width: number; height: number }`
  - `loadImageFile(file: Blob): Promise<LoadedImage>`
  - `type ClipboardImageResult = { ok: true; blob: Blob } | { ok: false; reason: "unsupported" | "denied" | "empty" }`
  - `readClipboardImage(clipboard?: Pick<Clipboard, "read">): Promise<ClipboardImageResult>`
  - `imageFromPasteEvent(event: Pick<ClipboardEvent, "clipboardData">): File | null`

> **한글 웹폰트 주의:** Google 한글 폰트는 글자 범위별로 수십 개 파일로 쪼개져 있다. `<canvas>`는 아직 안 받은 조각을 자동으로 기다리지 않고 기본 폰트로 그린다. 그래서 그리기·저장 전에 `document.fonts.load(font, 실제 글자)`로 필요한 조각을 받는다(`ensureFontsLoaded`). `preload`는 latin 조각만 미리 받는다. 이 결정의 이유는 `docs/decisions/0001-korean-font-loading.md`.

- [ ] **Step 1: Pretendard 파일 복사**

```bash
cp apps/web/node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 apps/web/src/features/editor/media/PretendardVariable.woff2
ls -la apps/web/src/features/editor/media/PretendardVariable.woff2
```

Expected: 파일 존재(약 2MB).

- [ ] **Step 2: 폰트 등록** — `media/fonts.ts`

```ts
import { Black_Han_Sans, Gowun_Batang, Jua, Nanum_Pen_Script } from "next/font/google";
import localFont from "next/font/local";
import type { Block, FontId } from "../model/types";

// 한글은 preload하지 않고 쓰는 글자만 그때 받는다 — docs/decisions/0001-korean-font-loading.md
const pretendard = localFont({
  src: "./PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  preload: false,
});
const gowunBatang = Gowun_Batang({ weight: "400", subsets: ["latin"], display: "swap" });
const jua = Jua({ weight: "400", subsets: ["latin"], display: "swap" });
const blackHanSans = Black_Han_Sans({ weight: "400", subsets: ["latin"], display: "swap" });
const nanumPen = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

export const FONTS: Record<FontId, { label: string; family: string }> = {
  pretendard: { label: "기본", family: pretendard.style.fontFamily },
  "gowun-batang": { label: "명조", family: gowunBatang.style.fontFamily },
  jua: { label: "동글", family: jua.style.fontFamily },
  "black-han-sans": { label: "굵게", family: blackHanSans.style.fontFamily },
  "nanum-pen": { label: "손글씨", family: nanumPen.style.fontFamily },
};

/** 텍스트 블록의 실제 글자로 필요한 폰트 조각을 불러온다. 실패해도 그리기는 계속한다. */
export async function ensureFontsLoaded(blocks: Block[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const loads = blocks.flatMap((block) =>
    block.type === "text"
      ? [document.fonts.load(`40px ${FONTS[block.fontId].family}`, block.text)]
      : [],
  );
  await Promise.allSettled(loads);
}
```

- [ ] **Step 3: 실패하는 테스트 작성** — `media/loadImage.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { pickOutputType } from "./loadImage";

describe("pickOutputType", () => {
  it("JPEG만 JPEG로 유지하고 나머지는 투명도를 지키도록 PNG로 바꾼다", () => {
    expect(pickOutputType("image/jpeg")).toBe("image/jpeg");
    expect(pickOutputType("image/png")).toBe("image/png");
    expect(pickOutputType("image/webp")).toBe("image/png");
    expect(pickOutputType("image/heic")).toBe("image/png");
    expect(pickOutputType("")).toBe("image/png");
  });
});
```

- [ ] **Step 4: 실패하는 테스트 작성** — `media/clipboard.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { imageFromPasteEvent, readClipboardImage } from "./clipboard";

const item = (types: string[], blob = new Blob(["x"], { type: types[0] })) =>
  ({ types, getType: async () => blob }) as unknown as ClipboardItem;

describe("readClipboardImage", () => {
  it("API가 없으면 unsupported", async () => {
    expect(await readClipboardImage(undefined)).toEqual({ ok: false, reason: "unsupported" });
  });

  it("권한 거부 등으로 read가 실패하면 denied", async () => {
    const clipboard = {
      read: async () => Promise.reject(new DOMException("no", "NotAllowedError")),
    };
    expect(await readClipboardImage(clipboard)).toEqual({ ok: false, reason: "denied" });
  });

  it("이미지 항목이 없으면 empty", async () => {
    const clipboard = { read: async () => [item(["text/plain"])] };
    expect(await readClipboardImage(clipboard)).toEqual({ ok: false, reason: "empty" });
  });

  it("이미지 항목이 있으면 blob을 돌려준다", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    const clipboard = { read: async () => [item(["text/plain"]), item(["image/png"], blob)] };
    expect(await readClipboardImage(clipboard)).toEqual({ ok: true, blob });
  });
});

describe("imageFromPasteEvent", () => {
  it("붙여넣은 파일 중 이미지를 돌려준다", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    const event = {
      clipboardData: {
        items: [
          { kind: "string", type: "text/plain" },
          { kind: "file", type: "image/png", getAsFile: () => file },
        ],
      },
    } as unknown as ClipboardEvent;
    expect(imageFromPasteEvent(event)).toBe(file);
  });

  it("이미지가 없으면 null", () => {
    const event = { clipboardData: { items: [] } } as unknown as ClipboardEvent;
    expect(imageFromPasteEvent(event)).toBeNull();
  });
});
```

- [ ] **Step 5: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/media`
Expected: FAIL — `Failed to resolve import "./loadImage"`, `"./clipboard"`

- [ ] **Step 6: 구현** — `media/loadImage.ts`

```ts
import imageCompression from "browser-image-compression";
import { MAX_IMAGE_EDGE } from "../model/constants";

export interface LoadedImage {
  src: string;
  width: number;
  height: number;
}

/** JPEG는 JPEG로, 나머지(PNG·WebP·HEIC 등)는 투명도를 지키도록 PNG로 */
export function pickOutputType(inputType: string): "image/jpeg" | "image/png" {
  return inputType === "image/jpeg" ? "image/jpeg" : "image/png";
}

export function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
    image.src = src;
  });
}

/** 긴 변 2048px로 줄이고 data URL로 바꾼다 */
export async function loadImageFile(file: Blob): Promise<LoadedImage> {
  const input = file instanceof File ? file : new File([file], "image", { type: file.type });
  const compressed = await imageCompression(input, {
    maxWidthOrHeight: MAX_IMAGE_EDGE,
    fileType: pickOutputType(input.type),
    initialQuality: 0.85,
    useWebWorker: true,
  });
  const src = await imageCompression.getDataUrlFromFile(compressed);
  const { width, height } = await measureImage(src);
  return { src, width, height };
}
```

- [ ] **Step 7: 구현** — `media/clipboard.ts`

```ts
export type ClipboardImageResult =
  { ok: true; blob: Blob } | { ok: false; reason: "unsupported" | "denied" | "empty" };

const defaultClipboard = () => (typeof navigator === "undefined" ? undefined : navigator.clipboard);

/** [붙여넣기] 버튼용. iOS는 "붙여넣기" 말풍선을 한 번 띄운다. */
export async function readClipboardImage(
  clipboard: Pick<Clipboard, "read"> | undefined = defaultClipboard(),
): Promise<ClipboardImageResult> {
  if (!clipboard || typeof clipboard.read !== "function")
    return { ok: false, reason: "unsupported" };

  let items: ClipboardItems;
  try {
    items = await clipboard.read();
  } catch {
    return { ok: false, reason: "denied" };
  }

  for (const item of items) {
    const type = item.types.find((t) => t.startsWith("image/"));
    if (type) return { ok: true, blob: await item.getType(type) };
  }
  return { ok: false, reason: "empty" };
}

/** PC Ctrl/Cmd+V용 */
export function imageFromPasteEvent(event: Pick<ClipboardEvent, "clipboardData">): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) return item.getAsFile();
  }
  return null;
}
```

- [ ] **Step 8: 통과 확인 + 타입 검사**

Run: `pnpm --filter web exec vitest run src/features/editor/media && pnpm --filter web typecheck`
Expected: PASS (7 tests), 타입 오류 없음

- [ ] **Step 9: 커밋**

```bash
git add apps/web/src/features/editor/media
git commit -m "feat(web): 에디터 폰트 5종·이미지 압축·클립보드 읽기 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `/editor` 라우트 + 비율·배경 선택 흐름

**Files:**

- Create: `apps/web/src/app/editor/page.tsx`
- Create: `apps/web/src/app/editor/editor-loader.tsx`
- Create: `apps/web/src/features/editor/EditorRoot.tsx`
- Create: `apps/web/src/features/editor/ui/BackgroundPicker.tsx`
- Create: `apps/web/src/features/editor/ui/SetupFlow.tsx`
- Create: `apps/web/src/features/editor/EditorScreen.tsx` (이 태스크에서는 임시 화면)
- Test: `apps/web/src/features/editor/ui/SetupFlow.test.tsx`

**Interfaces:**

- Consumes: Task 1 `initDoc`, `RATIO_OPTIONS`, `COLOR_PALETTE`, `DEFAULT_BACKGROUND`; Task 5 `useEditorDoc`, `useDocSnapshot`; Task 6 `loadImageFile`
- Produces:
  - `BackgroundPicker(props: { value: Background; onChange(background: Background): void })`
  - `SetupFlow(props: { onComplete(ratio: Ratio, background: Background): void })`
  - `EditorScreen(props: { handle: EditorDocHandle; snapshot: EditorSnapshot })`
  - `EditorRoot()` — 로딩 중 / 미초기화 → SetupFlow / 초기화됨 → EditorScreen

- [ ] **Step 1: 실패하는 테스트 작성** — `ui/SetupFlow.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupFlow } from "./SetupFlow";

vi.mock("../media/loadImage", () => ({ loadImageFile: vi.fn() }));

describe("SetupFlow", () => {
  it("비율 → 배경 색 → 시작하기 순서로 고르면 onComplete를 부른다", () => {
    const onComplete = vi.fn();
    render(<SetupFlow onComplete={onComplete} />);

    expect(screen.getByRole("heading", { name: "비율을 골라 주세요" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "4:5 세로" }));

    expect(screen.getByRole("heading", { name: "배경을 골라 주세요" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "#E53935" }));
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    expect(onComplete).toHaveBeenCalledWith("4:5", { type: "color", color: "#E53935" });
  });

  it("배경 단계에서 뒤로 가면 비율을 다시 고를 수 있다", () => {
    render(<SetupFlow onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "9:16 스토리" }));
    fireEvent.click(screen.getByRole("button", { name: "비율 다시 고르기" }));
    expect(screen.getByRole("heading", { name: "비율을 골라 주세요" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/SetupFlow.test.tsx`
Expected: FAIL — `Failed to resolve import "./SetupFlow"`

- [ ] **Step 3: 구현** — `ui/BackgroundPicker.tsx`

```tsx
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
```

- [ ] **Step 4: 구현** — `ui/SetupFlow.tsx`

```tsx
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
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/SetupFlow.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: 구현** — `EditorScreen.tsx` (임시 — Task 8에서 교체)

```tsx
"use client";

import type { EditorSnapshot } from "./model/types";
import type { EditorDocHandle } from "./state/useEditorDoc";

export function EditorScreen({ snapshot }: { handle: EditorDocHandle; snapshot: EditorSnapshot }) {
  return (
    <div data-testid="editor-canvas" data-block-count={snapshot.blocks.length} className="p-6">
      {snapshot.ratio} 에디터 준비 중
    </div>
  );
}
```

- [ ] **Step 7: 구현** — `EditorRoot.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { toast, Toaster } from "sonner";
import { EditorScreen } from "./EditorScreen";
import { initDoc } from "./model/doc";
import { useDocSnapshot } from "./state/useDocSnapshot";
import { useEditorDoc } from "./state/useEditorDoc";
import { SetupFlow } from "./ui/SetupFlow";

export function EditorRoot() {
  const handle = useEditorDoc();
  const snapshot = useDocSnapshot(handle.doc);

  useEffect(() => {
    if (handle.status === "ready" && !handle.persistent) {
      toast.warning("이 브라우저에서는 저장이 안 돼요. 새로고침하면 작업이 사라져요.");
    }
  }, [handle.status, handle.persistent]);

  return (
    <main className="min-h-dvh bg-neutral-900 text-white">
      <Toaster position="top-center" theme="dark" />
      {handle.status === "loading" ? (
        <p className="p-6 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : snapshot === null ? (
        <SetupFlow onComplete={(ratio, background) => initDoc(handle.doc, ratio, background)} />
      ) : (
        <EditorScreen handle={handle} snapshot={snapshot} />
      )}
    </main>
  );
}
```

- [ ] **Step 8: 구현** — `app/editor/editor-loader.tsx`

```tsx
"use client";

import dynamic from "next/dynamic";

// Konva·Yjs·IndexedDB는 브라우저 전용이라 서버 렌더링에서 뺀다.
const EditorRoot = dynamic(() => import("@/features/editor/EditorRoot").then((m) => m.EditorRoot), {
  ssr: false,
  loading: () => <p className="p-6 text-center text-sm text-neutral-400">에디터를 불러오는 중…</p>,
});

export function EditorLoader() {
  return <EditorRoot />;
}
```

- [ ] **Step 9: 구현** — `app/editor/page.tsx`

```tsx
import type { Metadata, Viewport } from "next";
import { EditorLoader } from "./editor-loader";

export const metadata: Metadata = { title: "에디터 실험" };

// 캔버스 제스처와 브라우저 확대가 겹치지 않게 막는다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function EditorPage() {
  return <EditorLoader />;
}
```

- [ ] **Step 10: 브라우저 확인**

Run: `pnpm dev:web` 후 `http://localhost:3000/editor` 접속.
Expected: "비율을 골라 주세요" → 비율 클릭 → "배경을 골라 주세요"(미리보기가 비율대로 보임) → 시작하기 → "9:16 에디터 준비 중". 새로고침해도 "에디터 준비 중"이 유지됨(IndexedDB). 개발자 도구 Application → IndexedDB에 `merry-editor-phase1` 존재.

- [ ] **Step 11: 검사 + 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 모두 통과

```bash
git add apps/web/src/app/editor apps/web/src/features/editor/EditorRoot.tsx apps/web/src/features/editor/EditorScreen.tsx apps/web/src/features/editor/ui
git commit -m "feat(web): /editor 라우트와 비율·배경 선택 흐름 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 캔버스 렌더링 + 상단 바 + 실행 취소

**Files:**

- Create: `apps/web/src/features/editor/canvas/useImageElement.ts`
- Create: `apps/web/src/features/editor/canvas/TextNode.tsx`
- Create: `apps/web/src/features/editor/canvas/StickerNode.tsx`
- Create: `apps/web/src/features/editor/canvas/EditorStage.tsx`
- Create: `apps/web/src/features/editor/ui/TopBar.tsx`
- Modify: `apps/web/src/features/editor/EditorScreen.tsx` (전체 교체)
- Test: `apps/web/src/features/editor/ui/TopBar.test.tsx`

**Interfaces:**

- Consumes: Task 1~6
- Produces:
  - `EditorStage(props: { snapshot: EditorSnapshot; viewScale: number; stageRef: RefObject<Konva.Stage | null>; fontsVersion: number; selectedId: string | null; guides: { x: boolean; y: boolean }; showOverlay: boolean; onTransformEnd(id: string, node: Konva.Node): void })`
    - 블록 그룹: `<Group id={block.id} name="block" …>` — 제스처가 `findAncestor(".block")`로 찾는다.
    - 오버레이(가이드선·Transformer)는 `<Layer name="overlay" visible={showOverlay}>`
  - `TopBar(props: { hidden: boolean; canUndo: boolean; canRedo: boolean; onClose(): void; onUndo(): void; onRedo(): void; onBackground(): void; onText(): void; onSticker(): void; onExport(): void; exporting: boolean })`
  - `EditorScreen` 내부 함수(이후 태스크가 채움): `handleTapBlock(id)`, `handleTapEmpty()`, `handleExport()`

- [ ] **Step 1: 실패하는 테스트 작성** — `ui/TopBar.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TopBar } from "./TopBar";

const props = () => ({
  hidden: false,
  canUndo: true,
  canRedo: false,
  exporting: false,
  onClose: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onBackground: vi.fn(),
  onText: vi.fn(),
  onSticker: vi.fn(),
  onExport: vi.fn(),
});

describe("TopBar", () => {
  it("버튼마다 해당 콜백을 부른다", () => {
    const p = props();
    render(<TopBar {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
    fireEvent.click(screen.getByRole("button", { name: "배경" }));
    fireEvent.click(screen.getByRole("button", { name: "텍스트 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "스티커 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "이미지 저장" }));
    fireEvent.click(screen.getByRole("button", { name: "새로 만들기" }));
    expect(p.onUndo).toHaveBeenCalled();
    expect(p.onBackground).toHaveBeenCalled();
    expect(p.onText).toHaveBeenCalled();
    expect(p.onSticker).toHaveBeenCalled();
    expect(p.onExport).toHaveBeenCalled();
    expect(p.onClose).toHaveBeenCalled();
  });

  it("되돌릴 수 없으면 버튼이 비활성화된다", () => {
    render(<TopBar {...props()} />);
    expect(screen.getByRole("button", { name: "다시 실행" })).toBeDisabled();
  });

  it("hidden이면 화면에서 숨긴다", () => {
    render(<TopBar {...props()} hidden />);
    expect(screen.queryByRole("button", { name: "실행 취소" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/TopBar.test.tsx`
Expected: FAIL — `Failed to resolve import "./TopBar"`

- [ ] **Step 3: 구현** — `ui/TopBar.tsx`

```tsx
"use client";

interface TopBarProps {
  hidden: boolean;
  canUndo: boolean;
  canRedo: boolean;
  exporting: boolean;
  onClose(): void;
  onUndo(): void;
  onRedo(): void;
  onBackground(): void;
  onText(): void;
  onSticker(): void;
  onExport(): void;
}

const iconButton =
  "flex size-10 items-center justify-center rounded-full bg-black/40 text-lg disabled:opacity-30";

export function TopBar(props: TopBarProps) {
  if (props.hidden) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex gap-2">
        <button aria-label="새로 만들기" className={iconButton} onClick={props.onClose}>
          ✕
        </button>
        <button
          aria-label="실행 취소"
          className={iconButton}
          disabled={!props.canUndo}
          onClick={props.onUndo}
        >
          ↶
        </button>
        <button
          aria-label="다시 실행"
          className={iconButton}
          disabled={!props.canRedo}
          onClick={props.onRedo}
        >
          ↷
        </button>
      </div>
      <div className="pointer-events-auto flex gap-2">
        <button aria-label="배경" className={iconButton} onClick={props.onBackground}>
          🎨
        </button>
        <button aria-label="텍스트 추가" className={iconButton} onClick={props.onText}>
          Aa
        </button>
        <button aria-label="스티커 추가" className={iconButton} onClick={props.onSticker}>
          🖼
        </button>
        <button
          aria-label="이미지 저장"
          className={iconButton}
          disabled={props.exporting}
          onClick={props.onExport}
        >
          ⬇
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/TopBar.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 구현** — `canvas/useImageElement.ts`

```ts
import { useEffect, useState } from "react";

/** src를 HTMLImageElement로 불러온다. 불러오기 전에는 null. */
export function useImageElement(src: string | null): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ src: string; element: HTMLImageElement } | null>(null);

  useEffect(() => {
    if (!src) return;
    const element = new Image();
    element.onload = () => setLoaded({ src, element });
    element.src = src;
    return () => {
      element.onload = null;
    };
  }, [src]);

  return loaded && loaded.src === src ? loaded.element : null;
}
```

- [ ] **Step 6: 구현** — `canvas/TextNode.tsx`

```tsx
"use client";

import Konva from "konva";
import { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import { FONTS } from "../media/fonts";
import { textStyle } from "../model/textStyle";
import type { TextBlock } from "../model/types";

const LINE_HEIGHT = 1.2;

function measure(block: TextBlock, family: string) {
  const probe = new Konva.Text({
    text: block.text,
    fontFamily: family,
    fontSize: block.fontSize,
    lineHeight: LINE_HEIGHT,
    align: block.align,
  });
  const size = { width: probe.width(), height: probe.height() };
  probe.destroy();
  return size;
}

export function TextNode({ block, fontsVersion }: { block: TextBlock; fontsVersion: number }) {
  const family = FONTS[block.fontId].family;
  // fontsVersion: 폰트 조각이 새로 로드되면 글자 폭을 다시 잰다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const size = useMemo(
    () => measure(block, family),
    [block.text, block.fontSize, block.align, family, fontsVersion],
  );
  const style = textStyle(block.color, block.textBg);
  const pad = style.box ? block.fontSize * 0.3 : 0;

  return (
    <Group
      id={block.id}
      name="block"
      x={block.x}
      y={block.y}
      rotation={block.rotation}
      scaleX={block.scale}
      scaleY={block.scale}
    >
      {style.box && (
        <Rect
          x={-size.width / 2 - pad}
          y={-size.height / 2 - pad}
          width={size.width + pad * 2}
          height={size.height + pad * 2}
          cornerRadius={block.fontSize * 0.25}
          fill={style.box}
        />
      )}
      <Text
        x={-size.width / 2}
        y={-size.height / 2}
        width={size.width}
        text={block.text}
        fontFamily={family}
        fontSize={block.fontSize}
        lineHeight={LINE_HEIGHT}
        align={block.align}
        fill={style.fill}
      />
    </Group>
  );
}
```

- [ ] **Step 7: 구현** — `canvas/StickerNode.tsx`

```tsx
"use client";

import { Group, Image as KonvaImage } from "react-konva";
import type { StickerBlock } from "../model/types";
import { useImageElement } from "./useImageElement";

export function StickerNode({ block }: { block: StickerBlock }) {
  const image = useImageElement(block.src);
  return (
    <Group
      id={block.id}
      name="block"
      x={block.x}
      y={block.y}
      rotation={block.rotation}
      scaleX={block.scale}
      scaleY={block.scale}
    >
      {image && (
        <KonvaImage
          image={image}
          x={-block.width / 2}
          y={-block.height / 2}
          width={block.width}
          height={block.height}
        />
      )}
    </Group>
  );
}
```

- [ ] **Step 8: 구현** — `canvas/EditorStage.tsx`

```tsx
"use client";

import type Konva from "konva";
import { type RefObject, useEffect, useRef } from "react";
import { Image as KonvaImage, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { CANVAS_SIZE } from "../model/constants";
import { coverRect } from "../model/geometry";
import type { EditorSnapshot } from "../model/types";
import { StickerNode } from "./StickerNode";
import { TextNode } from "./TextNode";
import { useImageElement } from "./useImageElement";

interface EditorStageProps {
  snapshot: EditorSnapshot;
  viewScale: number;
  stageRef: RefObject<Konva.Stage | null>;
  fontsVersion: number;
  selectedId: string | null;
  guides: { x: boolean; y: boolean };
  showOverlay: boolean;
  onTransformEnd(id: string, node: Konva.Node): void;
}

export function EditorStage(props: EditorStageProps) {
  const { snapshot, viewScale, stageRef } = props;
  const canvas = CANVAS_SIZE[snapshot.ratio];
  const bgImage = useImageElement(
    snapshot.background.type === "image" ? snapshot.background.src : null,
  );
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // PC 선택 핸들: 선택된 블록 노드에 Transformer를 붙인다.
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const node = props.selectedId ? stage.findOne(`#${CSS.escape(props.selectedId)}`) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [props.selectedId, snapshot.blocks, stageRef]);

  const strokeWidth = 2 / viewScale;

  return (
    <Stage
      ref={stageRef}
      width={canvas.width * viewScale}
      height={canvas.height * viewScale}
      scaleX={viewScale}
      scaleY={viewScale}
    >
      <Layer listening={false}>
        {snapshot.background.type === "color" ? (
          <Rect width={canvas.width} height={canvas.height} fill={snapshot.background.color} />
        ) : (
          bgImage && (
            <KonvaImage
              image={bgImage}
              {...coverRect({ width: bgImage.naturalWidth, height: bgImage.naturalHeight }, canvas)}
            />
          )
        )}
      </Layer>
      <Layer>
        {snapshot.blocks.map((block) =>
          block.type === "text" ? (
            <TextNode key={block.id} block={block} fontsVersion={props.fontsVersion} />
          ) : (
            <StickerNode key={block.id} block={block} />
          ),
        )}
      </Layer>
      <Layer name="overlay" visible={props.showOverlay}>
        {props.guides.x && (
          <Line
            points={[canvas.width / 2, 0, canvas.width / 2, canvas.height]}
            stroke="#FFD54F"
            strokeWidth={strokeWidth}
            listening={false}
          />
        )}
        {props.guides.y && (
          <Line
            points={[0, canvas.height / 2, canvas.width, canvas.height / 2]}
            stroke="#FFD54F"
            strokeWidth={strokeWidth}
            listening={false}
          />
        )}
        <Transformer
          ref={transformerRef}
          keepRatio
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          rotationSnaps={[0]}
          rotationSnapTolerance={5}
          onTransformEnd={(e) => props.onTransformEnd(e.target.id(), e.target)}
        />
      </Layer>
    </Stage>
  );
}
```

- [ ] **Step 9: 구현** — `EditorScreen.tsx` (전체 교체)

```tsx
"use client";

import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { EditorStage } from "./canvas/EditorStage";
import { ensureFontsLoaded } from "./media/fonts";
import { CANVAS_SIZE } from "./model/constants";
import { fitScale } from "./model/geometry";
import { updateBlock } from "./model/operations";
import type { EditorSnapshot } from "./model/types";
import { useUiStore } from "./state/uiStore";
import type { EditorDocHandle } from "./state/useEditorDoc";
import { useElementSize } from "./state/useElementSize";
import { useHistoryState } from "./state/useHistoryState";
import { TopBar } from "./ui/TopBar";

export function EditorScreen({
  handle,
  snapshot,
}: {
  handle: EditorDocHandle;
  snapshot: EditorSnapshot;
}) {
  const { doc, history } = handle;
  const stageRef = useRef<Konva.Stage | null>(null);
  const [areaRef, area] = useElementSize<HTMLDivElement>();
  const [fontsVersion, setFontsVersion] = useState(0);
  const { canUndo, canRedo } = useHistoryState(history);
  const ui = useUiStore();

  const canvas = CANVAS_SIZE[snapshot.ratio];
  const viewScale = area.width > 0 ? fitScale(canvas, area) : 0;

  // 폰트 조각이 새로 로드되면 글자 폭을 다시 잰다.
  useEffect(() => {
    const onLoaded = () => setFontsVersion((v) => v + 1);
    document.fonts.addEventListener("loadingdone", onLoaded);
    return () => document.fonts.removeEventListener("loadingdone", onLoaded);
  }, []);

  useEffect(() => {
    void ensureFontsLoaded(snapshot.blocks);
  }, [snapshot.blocks]);

  // iOS Safari의 페이지 핀치 확대를 막는다.
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", prevent);
    return () => document.removeEventListener("gesturestart", prevent);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950">
      <TopBar
        hidden={ui.dragging}
        canUndo={canUndo}
        canRedo={canRedo}
        exporting={ui.exporting}
        onClose={() => {}}
        onUndo={() => history.undo()}
        onRedo={() => history.redo()}
        onBackground={() => ui.openSheet("background")}
        onText={() => ui.openComposer(null)}
        onSticker={() => ui.openSheet("sticker")}
        onExport={() => {}}
      />
      <div
        ref={areaRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden"
      >
        {viewScale > 0 && (
          <div
            data-testid="editor-canvas"
            data-block-count={snapshot.blocks.length}
            className="touch-none select-none"
          >
            <EditorStage
              snapshot={snapshot}
              viewScale={viewScale}
              stageRef={stageRef}
              fontsVersion={fontsVersion}
              selectedId={ui.selectedId}
              guides={ui.guides}
              showOverlay={!ui.exporting}
              onTransformEnd={(id, node) =>
                updateBlock(
                  doc,
                  id,
                  { x: node.x(), y: node.y(), scale: node.scaleX(), rotation: node.rotation() },
                  { bringToFront: true },
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: 브라우저 확인**

Run: `pnpm dev:web` → `/editor` (이전 작업이 있으면 그대로 에디터가 열림).
Expected: 상단 바와 배경색이 칠해진 캔버스가 화면에 맞춰 보임. 창 크기를 바꾸면 캔버스가 따라 줄고 늘어남. 콘솔 에러 없음. (텍스트·스티커 추가는 Task 10·11에서)

- [ ] **Step 11: 검사 + 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 모두 통과

```bash
git add apps/web/src/features/editor
git commit -m "feat(web): Konva 캔버스 렌더링과 상단 바(실행 취소·다시 실행) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 제스처 (드래그·핀치·회전·휴지통·스냅·탭)

**Files:**

- Create: `apps/web/src/features/editor/gestures/useCanvasGestures.ts`
- Create: `apps/web/src/features/editor/ui/TrashZone.tsx`
- Modify: `apps/web/src/features/editor/EditorScreen.tsx`

**Interfaces:**

- Consumes: Task 2 `updateBlock`, `removeBlock`; Task 4 `snapToCenter`, `snapRotation`, `isInside`, `applyPinch`; Task 5 `useUiStore`
- Produces:
  - `useCanvasGestures(options: { targetRef: RefObject<HTMLDivElement | null>; stageRef: RefObject<Konva.Stage | null>; doc: Y.Doc; canvas: Size; viewScale: number; trashRef: RefObject<HTMLDivElement | null>; enabled: boolean; onTapBlock(id: string): void; onTapEmpty(): void }): void`
  - `TrashZone(props: { visible: boolean; active: boolean; ref: Ref<HTMLDivElement> })`

**동작 규칙(스펙 5절):**

- 한 손가락 드래그: 시작 시 `node.moveToTop()`(화면만), 이동 중 `snapToCenter`·가이드·휴지통 판정, 종료 시 휴지통 위면 `removeBlock`, 아니면 `updateBlock(…, { bringToFront: true })` 한 번.
- 두 손가락: 첫 손가락이 잡은 블록(없으면 핀치 중심점 아래 블록)에 `applyPinch` + `snapRotation`. 중심점 이동만큼 위치도 따라간다.
- 드래그와 핀치가 **모두 끝났을 때** 한 번만 기록한다.
- 탭: 블록 위면 `onTapBlock(id)`, 빈 곳이면 `onTapEmpty()`. Transformer 핸들 위 포인터는 무시(Konva가 처리).

- [ ] **Step 1: 구현** — `ui/TrashZone.tsx`

```tsx
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
```

- [ ] **Step 2: 구현** — `gestures/useCanvasGestures.ts`

```ts
"use client";

import { useGesture } from "@use-gesture/react";
import type Konva from "konva";
import { type RefObject, useLayoutEffect, useRef } from "react";
import type * as Y from "yjs";
import { applyPinch, isInside, snapRotation, snapToCenter } from "../model/geometry";
import { removeBlock, updateBlock } from "../model/operations";
import type { Size } from "../model/types";
import { useUiStore } from "../state/uiStore";

interface Options {
  targetRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<Konva.Stage | null>;
  doc: Y.Doc;
  canvas: Size;
  viewScale: number;
  trashRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  onTapBlock(id: string): void;
  onTapEmpty(): void;
}

type Hit = { kind: "block"; node: Konva.Group } | { kind: "handle" } | { kind: "empty" };

interface Active {
  node: Konva.Group;
  dragging: boolean;
  pinching: boolean;
  /** 드래그 기준 위치와, 그때의 movement 값 */
  base: { x: number; y: number };
  movementBase: [number, number];
  rebase: boolean;
  pinchStart: {
    scale: number;
    rotation: number;
    x: number;
    y: number;
    origin: [number, number];
  } | null;
  overTrash: boolean;
}

export function useCanvasGestures(options: Options): void {
  const active = useRef<Active | null>(null);
  // 제스처 핸들러가 항상 최신 옵션(viewScale 등)을 보도록 렌더 후에 동기화한다.
  const opts = useRef(options);
  useLayoutEffect(() => {
    opts.current = options;
  });

  function hitTest(clientX: number, clientY: number): Hit {
    const stage = opts.current.stageRef.current;
    if (!stage) return { kind: "empty" };
    const rect = stage.container().getBoundingClientRect();
    const shape = stage.getIntersection({ x: clientX - rect.left, y: clientY - rect.top });
    if (!shape) return { kind: "empty" };
    if (shape.findAncestor("Transformer")) return { kind: "handle" };
    const group = shape.findAncestor(".block") as Konva.Group | undefined;
    return group ? { kind: "block", node: group } : { kind: "empty" };
  }

  function begin(node: Konva.Group): Active {
    node.moveToTop();
    const next: Active = {
      node,
      dragging: false,
      pinching: false,
      base: { x: node.x(), y: node.y() },
      movementBase: [0, 0],
      rebase: false,
      pinchStart: null,
      overTrash: false,
    };
    active.current = next;
    return next;
  }

  /** 드래그·핀치가 모두 끝났을 때 한 번만 문서에 기록한다. */
  function finishIfIdle() {
    const a = active.current;
    if (!a || a.dragging || a.pinching) return;
    const ui = useUiStore.getState();
    const id = a.node.id();
    if (a.overTrash) {
      removeBlock(opts.current.doc, id);
    } else {
      updateBlock(
        opts.current.doc,
        id,
        { x: a.node.x(), y: a.node.y(), scale: a.node.scaleX(), rotation: a.node.rotation() },
        { bringToFront: true },
      );
    }
    a.node.opacity(1);
    active.current = null;
    ui.resetGesture();
  }

  useGesture(
    {
      onDrag: ({ first, last, tap, initial, xy, movement, pinching }) => {
        if (!opts.current.enabled) return;
        const ui = useUiStore.getState();

        if (tap && last) {
          const hit = hitTest(xy[0], xy[1]);
          if (hit.kind === "block") opts.current.onTapBlock(hit.node.id());
          else if (hit.kind === "empty") opts.current.onTapEmpty();
          return;
        }

        if (first) {
          if (active.current) {
            active.current.dragging = true;
          } else {
            const hit = hitTest(initial[0], initial[1]);
            if (hit.kind !== "block") return;
            begin(hit.node).dragging = true;
          }
          ui.setDragging(true);
        }

        const a = active.current;
        if (!a) return;

        if (last) {
          a.dragging = false;
          finishIfIdle();
          return;
        }

        if (pinching || a.pinching) {
          a.rebase = true;
          return;
        }
        if (a.rebase) {
          a.base = { x: a.node.x(), y: a.node.y() };
          a.movementBase = [movement[0], movement[1]];
          a.rebase = false;
        }

        const { viewScale, canvas, trashRef } = opts.current;
        const raw = {
          x: a.base.x + (movement[0] - a.movementBase[0]) / viewScale,
          y: a.base.y + (movement[1] - a.movementBase[1]) / viewScale,
        };
        const snapped = snapToCenter(raw, canvas);
        a.node.position({ x: snapped.x, y: snapped.y });
        ui.setGuides({ x: snapped.guideX, y: snapped.guideY });

        const trash = trashRef.current?.getBoundingClientRect();
        a.overTrash = trash ? isInside({ x: xy[0], y: xy[1] }, trash, 16) : false;
        a.node.opacity(a.overTrash ? 0.5 : 1);
        ui.setOverTrash(a.overTrash);
        a.node.getLayer()?.batchDraw();
      },

      onPinch: ({ first, last, origin, movement }) => {
        if (!opts.current.enabled) return;

        if (first) {
          let a = active.current;
          if (!a) {
            const hit = hitTest(origin[0], origin[1]);
            if (hit.kind !== "block") return;
            a = begin(hit.node);
          }
          a.pinching = true;
          a.overTrash = false;
          a.node.opacity(1);
          a.pinchStart = {
            scale: a.node.scaleX(),
            rotation: a.node.rotation(),
            x: a.node.x(),
            y: a.node.y(),
            origin: [origin[0], origin[1]],
          };
          useUiStore.getState().setDragging(true);
          useUiStore.getState().setOverTrash(false);
        }

        const a = active.current;
        if (!a || !a.pinchStart) return;

        if (last) {
          a.pinching = false;
          a.pinchStart = null;
          a.rebase = true;
          finishIfIdle();
          return;
        }

        const { viewScale } = opts.current;
        const next = applyPinch(a.pinchStart, [movement[0], movement[1]]);
        a.node.scale({ x: next.scale, y: next.scale });
        a.node.rotation(snapRotation(next.rotation));
        a.node.position({
          x: a.pinchStart.x + (origin[0] - a.pinchStart.origin[0]) / viewScale,
          y: a.pinchStart.y + (origin[1] - a.pinchStart.origin[1]) / viewScale,
        });
        a.node.getLayer()?.batchDraw();
      },
    },
    {
      target: options.targetRef,
      eventOptions: { passive: false },
      drag: { filterTaps: true, pointer: { touch: true } },
      pinch: { scaleBounds: { min: 0.1, max: 10 }, rubberband: false },
    },
  );
}
```

> **주의:** `useGesture`의 `pinch.movement`는 `[배율 비, 각도 변화(도)]`다. 첫 이벤트에서 시작 값을 저장하고 `applyPinch(start, movement)`로 계산한다.

- [ ] **Step 3: EditorScreen에 연결** — `EditorScreen.tsx` 수정

import 추가:

```tsx
import { useCanvasGestures } from "./gestures/useCanvasGestures";
import { TrashZone } from "./ui/TrashZone";
```

`stageRef` 선언 아래에 추가:

```tsx
const canvasRef = useRef<HTMLDivElement | null>(null);
const trashRef = useRef<HTMLDivElement | null>(null);
const finePointer = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

function handleTapBlock(id: string) {
  const block = snapshot.blocks.find((b) => b.id === id);
  if (!block) return;
  if (finePointer && ui.selectedId !== id) {
    ui.select(id);
    return;
  }
  if (block.type === "text") ui.openComposer(id);
}

function handleTapEmpty() {
  if (finePointer && ui.selectedId) {
    ui.select(null);
    return;
  }
  ui.openComposer(null);
}

useCanvasGestures({
  targetRef: canvasRef,
  stageRef,
  doc,
  canvas,
  viewScale,
  trashRef,
  enabled: ui.composer === null && ui.sheet === null && viewScale > 0,
  onTapBlock: handleTapBlock,
  onTapEmpty: handleTapEmpty,
});
```

캔버스 감싸는 `div`에 `ref={canvasRef}` 추가:

```tsx
          <div
            ref={canvasRef}
            data-testid="editor-canvas"
            data-block-count={snapshot.blocks.length}
            className="touch-none select-none"
          >
```

캔버스 영역 `div`(areaRef) 안, 캔버스 다음에 추가:

```tsx
<TrashZone ref={trashRef} visible={ui.dragging} active={ui.overTrash} />
```

- [ ] **Step 4: 검사**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 모두 통과

- [ ] **Step 5: 수동 확인 시점**

이 시점에는 블록을 추가할 UI가 없다. 제스처 수동 확인은 Task 10 Step 6에서 텍스트를 추가한 뒤 함께 한다(드래그 시 상단 바 숨김·휴지통 표시, 중앙 가이드·스냅, 휴지통 삭제, ↶ 복구, 기기 모드 Shift+드래그 핀치·회전).

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/features/editor
git commit -m "feat(web): 캔버스 제스처(드래그·핀치·회전·휴지통·중앙 스냅·탭) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 텍스트 입력 화면 (TextComposer)

**Files:**

- Create: `apps/web/src/features/editor/ui/TextComposer.tsx`
- Modify: `apps/web/src/features/editor/EditorScreen.tsx`
- Test: `apps/web/src/features/editor/ui/TextComposer.test.tsx`

**Interfaces:**

- Consumes: Task 1 `DEFAULT_TEXT_DRAFT`, `FONT_IDS`, `COLOR_PALETTE`, `FONT_SIZE_RANGE`; Task 2 `commitTextDraft`; Task 4 `textStyle`; Task 6 `FONTS`
- Produces: `TextComposer(props: { initial: TextDraft; onDone(draft: TextDraft): void })`

- [ ] **Step 1: 실패하는 테스트 작성** — `ui/TextComposer.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TEXT_DRAFT } from "../model/constants";
import { TextComposer } from "./TextComposer";

vi.mock("../media/fonts", () => ({
  FONTS: {
    pretendard: { label: "기본", family: "sans-serif" },
    "gowun-batang": { label: "명조", family: "serif" },
    jua: { label: "동글", family: "sans-serif" },
    "black-han-sans": { label: "굵게", family: "sans-serif" },
    "nanum-pen": { label: "손글씨", family: "cursive" },
  },
}));

describe("TextComposer", () => {
  it("입력한 내용과 고른 스타일로 onDone을 부른다", () => {
    const onDone = vi.fn();
    render(<TextComposer initial={DEFAULT_TEXT_DRAFT} onDone={onDone} />);

    fireEvent.change(screen.getByRole("textbox", { name: "텍스트 입력" }), {
      target: { value: "메리 크리스마스" },
    });
    fireEvent.click(screen.getByRole("button", { name: "손글씨" }));
    fireEvent.click(screen.getByRole("button", { name: "색 #E53935" }));
    fireEvent.click(screen.getByRole("button", { name: "정렬: 가운데" }));
    fireEvent.click(screen.getByRole("button", { name: "글자 배경: 없음" }));
    fireEvent.click(screen.getByRole("button", { name: "완료" }));

    expect(onDone).toHaveBeenCalledWith({
      ...DEFAULT_TEXT_DRAFT,
      text: "메리 크리스마스",
      fontId: "nanum-pen",
      color: "#E53935",
      align: "right",
      textBg: "solid",
    });
  });

  it("기존 값으로 시작한다", () => {
    render(<TextComposer initial={{ ...DEFAULT_TEXT_DRAFT, text: "기존" }} onDone={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "텍스트 입력" })).toHaveValue("기존");
  });

  it("글자 크기 슬라이더 값이 반영된다", () => {
    const onDone = vi.fn();
    render(<TextComposer initial={{ ...DEFAULT_TEXT_DRAFT, text: "a" }} onDone={onDone} />);
    fireEvent.change(screen.getByRole("slider", { name: "글자 크기" }), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByRole("button", { name: "완료" }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ fontSize: 150 }));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/TextComposer.test.tsx`
Expected: FAIL — `Failed to resolve import "./TextComposer"`

- [ ] **Step 3: 구현** — `ui/TextComposer.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { FONTS } from "../media/fonts";
import { COLOR_PALETTE, FONT_IDS, FONT_SIZE_RANGE } from "../model/constants";
import { textStyle } from "../model/textStyle";
import type { TextAlign, TextBg, TextDraft } from "../model/types";

const ALIGN_NEXT: Record<TextAlign, TextAlign> = { left: "center", center: "right", right: "left" };
const ALIGN_LABEL: Record<TextAlign, string> = { left: "왼쪽", center: "가운데", right: "오른쪽" };
const BG_NEXT: Record<TextBg, TextBg> = {
  none: "solid",
  solid: "translucent",
  translucent: "none",
};
const BG_LABEL: Record<TextBg, string> = {
  none: "없음",
  solid: "꽉 찬 박스",
  translucent: "반투명 박스",
};

/** iOS 키보드가 올라오면 보이는 영역 높이에 맞춘다. */
function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setHeight(viewport.height);
    update();
    viewport.addEventListener("resize", update);
    return () => viewport.removeEventListener("resize", update);
  }, []);
  return height;
}

export function TextComposer({
  initial,
  onDone,
}: {
  initial: TextDraft;
  onDone(draft: TextDraft): void;
}) {
  const [draft, setDraft] = useState<TextDraft>(initial);
  const viewportHeight = useVisualViewportHeight();
  const style = textStyle(draft.color, draft.textBg);
  const set = (patch: Partial<TextDraft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div
      role="dialog"
      aria-label="텍스트 편집"
      className="fixed inset-x-0 top-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      style={{ height: viewportHeight ?? "100dvh" }}
    >
      <div className="flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex gap-2">
          <button
            aria-label={`정렬: ${ALIGN_LABEL[draft.align]}`}
            className="rounded-full bg-white/15 px-3 py-2 text-sm"
            onClick={() => set({ align: ALIGN_NEXT[draft.align] })}
          >
            {ALIGN_LABEL[draft.align]}
          </button>
          <button
            aria-label={`글자 배경: ${BG_LABEL[draft.textBg]}`}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-bold",
              draft.textBg === "none" ? "bg-white/15" : "bg-white text-black",
            )}
            onClick={() => set({ textBg: BG_NEXT[draft.textBg] })}
          >
            A
          </button>
        </div>
        <button
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          onClick={() => onDone(draft)}
        >
          완료
        </button>
      </div>

      <div className="flex flex-1 items-center gap-2 overflow-hidden px-3">
        <input
          type="range"
          aria-label="글자 크기"
          min={FONT_SIZE_RANGE.min}
          max={FONT_SIZE_RANGE.max}
          value={draft.fontSize}
          onChange={(e) => set({ fontSize: Number(e.target.value) })}
          className="h-48 w-6 [direction:rtl] [writing-mode:vertical-lr]"
        />
        <div className="flex flex-1 justify-center">
          <textarea
            aria-label="텍스트 입력"
            autoFocus
            rows={3}
            value={draft.text}
            onChange={(e) => set({ text: e.target.value })}
            className="w-full resize-none rounded-lg bg-transparent p-2 outline-none"
            style={{
              fontFamily: FONTS[draft.fontId].family,
              // 화면용 미리보기 크기: 논리 크기의 1/3
              fontSize: draft.fontSize / 3,
              lineHeight: 1.2,
              textAlign: draft.align,
              color: style.fill,
              backgroundColor: style.box ?? "transparent",
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {FONT_IDS.map((id) => (
            <button
              key={id}
              aria-pressed={draft.fontId === id}
              onClick={() => set({ fontId: id })}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm",
                draft.fontId === id ? "border-white bg-white text-black" : "border-white/40",
              )}
              style={{ fontFamily: FONTS[id].family }}
            >
              {FONTS[id].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              aria-label={`색 ${color}`}
              aria-pressed={draft.color === color}
              onClick={() => set({ color })}
              className={cn(
                "size-8 shrink-0 rounded-full border-2",
                draft.color === color ? "border-white" : "border-white/30",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/TextComposer.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: EditorScreen에 연결** — `EditorScreen.tsx` 수정

import 추가:

```tsx
import { DEFAULT_TEXT_DRAFT } from "./model/constants";
import { commitTextDraft } from "./model/operations";
import type { TextDraft } from "./model/types";
import { TextComposer } from "./ui/TextComposer";
```

(`CANVAS_SIZE` import 줄에 `DEFAULT_TEXT_DRAFT`를 합쳐도 된다.)

`handleTapEmpty` 아래에 추가:

```tsx
function composerInitial(): TextDraft {
  const id = ui.composer?.blockId;
  const block = id ? snapshot.blocks.find((b) => b.id === id) : undefined;
  if (block?.type !== "text") return DEFAULT_TEXT_DRAFT;
  const { text, fontId, fontSize, color, align, textBg } = block;
  return { text, fontId, fontSize, color, align, textBg };
}
```

최상위 `div`의 마지막 자식으로 추가:

```tsx
{
  ui.composer && (
    <TextComposer
      key={ui.composer.blockId ?? "new"}
      initial={composerInitial()}
      onDone={(draft) => {
        commitTextDraft(doc, canvas, ui.composer?.blockId ?? null, draft);
        ui.closeComposer();
      }}
    />
  );
}
```

- [ ] **Step 6: 브라우저 확인 (Task 9 제스처 포함)**

Run: `pnpm dev:web` → `/editor`, Chrome 개발자 도구 기기 모드(iPhone).
Expected:

- `Aa` 또는 빈 캔버스 탭 → 입력 화면, 입력 후 완료 → 중앙에 텍스트
- 폰트 버튼마다 글꼴이 바뀌고, A 버튼으로 박스 스타일 순환, 정렬 순환, 슬라이더로 크기 변경
- 텍스트 탭 → 기존 내용으로 입력 화면, 지우고 완료 → 삭제
- Task 9 확인 항목(드래그·스냅·휴지통·Shift+드래그 핀치·회전) 모두 동작, ↶ ↷ 동작

- [ ] **Step 7: 검사 + 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 모두 통과

```bash
git add apps/web/src/features/editor
git commit -m "feat(web): 인스타식 텍스트 입력 화면(폰트·색·정렬·글자 배경·크기) 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: 스티커(앨범·붙여넣기) + 배경 변경 시트

**Files:**

- Create: `apps/web/src/features/editor/ui/BottomSheet.tsx`
- Create: `apps/web/src/features/editor/ui/StickerSheet.tsx`
- Create: `apps/web/src/features/editor/ui/BackgroundSheet.tsx`
- Modify: `apps/web/src/features/editor/EditorScreen.tsx`
- Test: `apps/web/src/features/editor/ui/StickerSheet.test.tsx`

**Interfaces:**

- Consumes: Task 2 `addSticker`, `setBackground`; Task 4 `stickerInitialScale`; Task 6 `loadImageFile`, `readClipboardImage`, `imageFromPasteEvent`; Task 7 `BackgroundPicker`
- Produces:
  - `BottomSheet(props: { open: boolean; title: string; onClose(): void; children: ReactNode })`
  - `StickerSheet(props: { open: boolean; onClose(): void; onPicked(image: LoadedImage): void })`
  - `BackgroundSheet(props: { open: boolean; value: Background; onClose(): void; onChange(background: Background): void })`

- [ ] **Step 1: 실패하는 테스트 작성** — `ui/StickerSheet.test.tsx`

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StickerSheet } from "./StickerSheet";

const loadImageFile = vi.fn();
const readClipboardImage = vi.fn();
const toastError = vi.fn();

vi.mock("../media/loadImage", () => ({ loadImageFile: (f: Blob) => loadImageFile(f) }));
vi.mock("../media/clipboard", () => ({ readClipboardImage: () => readClipboardImage() }));
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m) } }));

beforeEach(() => vi.clearAllMocks());

describe("StickerSheet", () => {
  it("붙여넣기에 성공하면 불러온 이미지로 onPicked를 부른다", async () => {
    const blob = new Blob(["x"], { type: "image/png" });
    const image = { src: "data:x", width: 10, height: 20 };
    readClipboardImage.mockResolvedValue({ ok: true, blob });
    loadImageFile.mockResolvedValue(image);
    const onPicked = vi.fn();

    render(<StickerSheet open onClose={vi.fn()} onPicked={onPicked} />);
    fireEvent.click(screen.getByRole("button", { name: "붙여넣기" }));

    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(image));
    expect(loadImageFile).toHaveBeenCalledWith(blob);
  });

  it("클립보드에 이미지가 없으면 안내한다", async () => {
    readClipboardImage.mockResolvedValue({ ok: false, reason: "empty" });
    render(<StickerSheet open onClose={vi.fn()} onPicked={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "붙여넣기" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("복사된 이미지가 없어요"));
  });

  it("붙여넣기가 막힌 환경이면 앨범으로 안내한다", async () => {
    readClipboardImage.mockResolvedValue({ ok: false, reason: "unsupported" });
    render(<StickerSheet open onClose={vi.fn()} onPicked={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "붙여넣기" }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "이 환경에서는 붙여넣기가 안 돼요. 앨범에서 골라 주세요",
      ),
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/StickerSheet.test.tsx`
Expected: FAIL — `Failed to resolve import "./StickerSheet"`

- [ ] **Step 3: 구현** — `ui/BottomSheet.tsx`

```tsx
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
```

- [ ] **Step 4: 구현** — `ui/StickerSheet.tsx`

```tsx
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
```

- [ ] **Step 5: 구현** — `ui/BackgroundSheet.tsx`

```tsx
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
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/ui/StickerSheet.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 7: EditorScreen에 연결** — `EditorScreen.tsx` 수정

import 추가:

```tsx
import { toast } from "sonner";
import { imageFromPasteEvent } from "./media/clipboard";
import { type LoadedImage, loadImageFile } from "./media/loadImage";
import { stickerInitialScale } from "./model/geometry";
import { addSticker, setBackground } from "./model/operations";
import { BackgroundSheet } from "./ui/BackgroundSheet";
import { StickerSheet } from "./ui/StickerSheet";
```

(`fitScale` import 줄에 `stickerInitialScale`을, `updateBlock`·`commitTextDraft` import 줄에 `addSticker`·`setBackground`를 합친다.)

`composerInitial` 아래에 추가:

```tsx
function addStickerFromImage(image: LoadedImage) {
  addSticker(doc, {
    src: image.src,
    width: image.width,
    height: image.height,
    x: canvas.width / 2,
    y: canvas.height / 2,
    rotation: 0,
    scale: stickerInitialScale(image, canvas),
  });
  ui.closeSheet();
}

// PC: Ctrl/Cmd+V로 이미지 붙여넣기
useEffect(() => {
  const onPaste = (event: ClipboardEvent) => {
    if (useUiStore.getState().composer) return;
    const file = imageFromPasteEvent(event);
    if (!file) return;
    event.preventDefault();
    loadImageFile(file)
      .then(addStickerFromImage)
      .catch(() => toast.error("이미지를 불러오지 못했어요"));
  };
  window.addEventListener("paste", onPaste);
  return () => window.removeEventListener("paste", onPaste);
});
```

최상위 `div`의 마지막 자식으로 추가:

```tsx
      <StickerSheet open={ui.sheet === "sticker"} onClose={ui.closeSheet} onPicked={addStickerFromImage} />
      <BackgroundSheet
        open={ui.sheet === "background"}
        value={snapshot.background}
        onClose={ui.closeSheet}
        onChange={(background) => setBackground(doc, background)}
      />
```

- [ ] **Step 8: 브라우저 확인**

Run: `pnpm dev:web` → `/editor`.
Expected:

- 🖼 → [앨범에서 고르기]로 PNG(투명 배경) 선택 → 캔버스 중앙에 투명 배경 유지된 스티커, 긴 변이 캔버스 짧은 변의 절반
- 다른 앱에서 이미지 복사 → 🖼 → [붙여넣기] → 스티커 추가 (Chrome은 권한 팝업)
- PC: 이미지 복사 후 Cmd/Ctrl+V → 스티커 추가
- 🎨 → 색 변경 즉시 반영, ↶로 이전 배경 복구, 사진 탭에서 사진 배경

- [ ] **Step 9: 검사 + 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 모두 통과

```bash
git add apps/web/src/features/editor
git commit -m "feat(web): 스티커 추가(앨범·붙여넣기)와 배경 변경 시트 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: PNG 저장 + 새로 만들기

**Files:**

- Create: `apps/web/src/features/editor/export/exportPng.ts`
- Modify: `apps/web/src/features/editor/EditorScreen.tsx`
- Test: `apps/web/src/features/editor/export/exportPng.test.ts`

**Interfaces:**

- Consumes: Task 5 `useUiStore.setExporting`, `EditorDocHandle.reset`; Task 6 `ensureFontsLoaded`
- Produces:
  - `exportStageToPng(stage: Konva.Stage, logicalWidth: number): Promise<Blob>`
  - `saveImage(blob: Blob, filename: string, nav?: Pick<Navigator, "canShare" | "share">): Promise<"shared" | "downloaded" | "cancelled">`

- [ ] **Step 1: 실패하는 테스트 작성** — `export/exportPng.test.ts`

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveImage } from "./exportPng";

const blob = new Blob(["png"], { type: "image/png" });

afterEach(() => vi.restoreAllMocks());

describe("saveImage", () => {
  it("파일 공유가 되면 공유 시트를 연다", async () => {
    const nav = { canShare: vi.fn(() => true), share: vi.fn(async () => {}) };
    expect(await saveImage(blob, "a.png", nav)).toBe("shared");
    expect(nav.share).toHaveBeenCalledWith({ files: [expect.any(File)] });
  });

  it("사용자가 공유를 취소하면 cancelled", async () => {
    const nav = {
      canShare: () => true,
      share: async () => Promise.reject(new DOMException("x", "AbortError")),
    };
    expect(await saveImage(blob, "a.png", nav)).toBe("cancelled");
  });

  it("공유가 안 되면 파일로 내려받는다", async () => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const nav = { canShare: () => false, share: vi.fn() };
    expect(await saveImage(blob, "a.png", nav)).toBe("downloaded");
    expect(click).toHaveBeenCalled();
  });

  it("공유가 다른 이유로 실패하면 내려받기로 대체한다", async () => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const nav = {
      canShare: () => true,
      share: async () => Promise.reject(new DOMException("x", "NotAllowedError")),
    };
    expect(await saveImage(blob, "a.png", nav)).toBe("downloaded");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/export/exportPng.test.ts`
Expected: FAIL — `Failed to resolve import "./exportPng"`

- [ ] **Step 3: 구현** — `export/exportPng.ts`

```ts
import type Konva from "konva";

/** 화면에 축소돼 그려진 Stage를 논리 해상도 PNG로 만든다. */
export async function exportStageToPng(stage: Konva.Stage, logicalWidth: number): Promise<Blob> {
  const pixelRatio = logicalWidth / stage.width();
  return (await stage.toBlob({ pixelRatio, mimeType: "image/png" })) as Blob;
}

/** iOS 등 파일 공유가 되면 공유 시트(“이미지 저장”), 아니면 파일 다운로드 */
export async function saveImage(
  blob: Blob,
  filename: string,
  nav: Pick<Navigator, "canShare" | "share"> = navigator,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // 그 외 실패는 다운로드로 대체
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter web exec vitest run src/features/editor/export/exportPng.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: EditorScreen에 연결** — `EditorScreen.tsx` 수정

import 추가:

```tsx
import { exportStageToPng, saveImage } from "./export/exportPng";
```

`addStickerFromImage` 아래에 추가:

```tsx
async function handleExport() {
  const stage = stageRef.current;
  if (!stage) return;
  ui.select(null);
  ui.setExporting(true);
  try {
    await ensureFontsLoaded(snapshot.blocks);
    // 오버레이(가이드·핸들)가 숨겨진 상태로 다시 그려질 때까지 한 프레임 기다린다.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const blob = await exportStageToPng(stage, canvas.width);
    const result = await saveImage(blob, `merry-${Date.now()}.png`);
    if (result === "downloaded") toast.success("이미지를 저장했어요");
  } catch {
    toast.error("이미지를 만들지 못했어요");
  } finally {
    ui.setExporting(false);
  }
}

function handleNew() {
  if (!window.confirm("지금 작업이 모두 지워져요. 새로 만들까요?")) return;
  ui.select(null);
  handle.reset();
}
```

`TopBar`의 두 콜백을 교체:

```tsx
        onClose={handleNew}
        ...
        onExport={() => void handleExport()}
```

- [ ] **Step 6: 브라우저 확인**

Run: `pnpm dev:web` → `/editor`, 텍스트(손글씨 폰트)·스티커·사진 배경을 넣고 ⬇.
Expected: PC Chrome은 공유 시트 또는 `merry-*.png` 다운로드. 파일을 열면 9:16 기준 1080×1920, 가이드선·핸들 없음, 손글씨 폰트 그대로. ✕ → 확인 → 비율 선택 화면.

- [ ] **Step 7: 검사 + 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 모두 통과

```bash
git add apps/web/src/features/editor
git commit -m "feat(web): PNG 저장(공유 시트·다운로드)과 새로 만들기 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: E2E 흐름 테스트 + 실험 결과 문서

**Files:**

- Create: `apps/web/e2e/editor.spec.ts`
- Create: `docs/experiments/editor-phase1.md`

**Interfaces:**

- Consumes: 화면 문구·접근성 이름 — "9:16 스토리", "시작하기", "텍스트 추가", "텍스트 입력", "완료", "이미지 저장", `data-testid="editor-canvas"`, `data-block-count`

- [ ] **Step 1: E2E 테스트 작성** — `apps/web/e2e/editor.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test("비율 → 배경 → 텍스트 추가 → 새로고침 후 유지 → PNG 저장", async ({ page, browserName }) => {
  await page.goto("/editor");

  await page.getByRole("button", { name: "9:16 스토리" }).click();
  await page.getByRole("button", { name: "#E53935" }).click();
  await page.getByRole("button", { name: "시작하기" }).click();

  const canvas = page.getByTestId("editor-canvas");
  await expect(canvas).toHaveAttribute("data-block-count", "0");

  await page.getByRole("button", { name: "텍스트 추가" }).click();
  await page.getByRole("textbox", { name: "텍스트 입력" }).fill("메리 크리스마스");
  await page.getByRole("button", { name: "완료" }).click();
  await expect(canvas).toHaveAttribute("data-block-count", "1");

  await page.reload();
  await expect(page.getByTestId("editor-canvas")).toHaveAttribute("data-block-count", "1");

  // WebKit은 공유 시트를 열 수 있어 다운로드 검증은 Chromium에서만 한다.
  test.skip(browserName !== "chromium", "다운로드 검증은 Chromium에서만");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "이미지 저장" }).click();
  expect((await download).suggestedFilename()).toMatch(/^merry-\d+\.png$/);
});

test("실행 취소로 삭제한 텍스트를 되살린다", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "1:1 정사각형" }).click();
  await page.getByRole("button", { name: "시작하기" }).click();

  await page.getByRole("button", { name: "텍스트 추가" }).click();
  await page.getByRole("textbox", { name: "텍스트 입력" }).fill("지울 글자");
  await page.getByRole("button", { name: "완료" }).click();

  const canvas = page.getByTestId("editor-canvas");
  await expect(canvas).toHaveAttribute("data-block-count", "1");

  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(canvas).toHaveAttribute("data-block-count", "0");
  await page.getByRole("button", { name: "다시 실행" }).click();
  await expect(canvas).toHaveAttribute("data-block-count", "1");
});
```

- [ ] **Step 2: E2E 실행**

Run: `pnpm --filter web exec playwright install chromium webkit && pnpm --filter web test:e2e`
Expected: PASS (smoke 2 + editor 4 = 6 tests, WebKit 다운로드 부분은 skip). 실패 시 `apps/web/playwright-report`에서 원인 확인 후 수정.

- [ ] **Step 3: 실험 결과 문서 틀 작성** — `docs/experiments/editor-phase1.md`

```markdown
# 에디터 실험 1단계 결과

- 이슈: #11 · 설계: `docs/superpowers/specs/2026-11-24-editor-phase1-design.md`
- 확인 방법: 같은 와이파이에서 `DEV_ALLOWED_ORIGINS=<PC IP> pnpm dev:web` → 휴대폰으로 `http://<PC IP>:3000/editor`
  - 클립보드 붙여넣기·공유 시트는 HTTPS가 필요할 수 있다. 막히면 HTTPS 터널로 다시 확인하고 비고에 적는다.

## 기기

| 기기    | OS / 브라우저          | 비고 |
| ------- | ---------------------- | ---- |
| iPhone  | iOS __ / Safari        |      |
| Android | Android __ / Chrome    |      |
| iPhone  | 카카오톡 인앱 브라우저 |      |

## 확인 항목

✅ 됨 · ⚠️ 부분적으로 됨(비고) · ❌ 안 됨

| #   | 항목                                                                          | iPhone Safari | Android Chrome | 카톡 인앱 | 비고 |
| --- | ----------------------------------------------------------------------------- | ------------- | -------------- | --------- | ---- |
| 1   | 요소 20개에서 드래그·핀치가 끊기지 않음                                       |               |                |           |      |
| 2   | 핀치할 때 페이지 확대·스크롤이 일어나지 않음                                  |               |                |           |      |
| 3   | 텍스트 입력 중 키보드가 올라와도 화면이 깨지지 않음                           |               |                |           |      |
| 4   | 폰트 5종이 캔버스와 저장 이미지에 처음부터 나옴                               |               |                |           |      |
| 5   | 누끼 붙여넣기 시 투명 배경 유지                                               |               |                |           |      |
| 6   | 원본 해상도 PNG 저장, 사진 앱에 저장됨                                        |               |                |           |      |
| 7   | 제스처 하나가 실행 취소 한 단계                                               |               |                |           |      |
| 8   | 새로고침 후 작업 유지                                                         |               |                |           |      |
| 9   | 새 글자 첫 입력 때 폰트가 늦게 바뀌는 게 거슬리지 않음 (ADR 0001 재검토 기준) |               |                |           |      |

## 발견한 문제

-

## 2단계·BE 논의에 넘길 것

-
```

- [ ] **Step 4: 전체 검사 + 커밋**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build:web`
Expected: 모두 통과

```bash
git add apps/web/e2e/editor.spec.ts docs/experiments/editor-phase1.md
git commit -m "test(web): 에디터 E2E 흐름 테스트와 실기기 실험 결과 문서 틀 추가

Refs #11

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: 실기기 확인 안내**

사용자에게 `docs/experiments/editor-phase1.md`의 확인 항목을 실제 기기로 확인해 달라고 요청한다. 결과를 받아 표를 채우고 별도 커밋한다.
