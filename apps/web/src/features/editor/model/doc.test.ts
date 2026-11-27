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
