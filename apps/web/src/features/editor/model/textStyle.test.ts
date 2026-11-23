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
