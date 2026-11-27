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
