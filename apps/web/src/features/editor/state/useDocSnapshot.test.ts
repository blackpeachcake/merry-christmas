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
