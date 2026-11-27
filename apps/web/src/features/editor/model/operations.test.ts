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
