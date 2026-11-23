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
