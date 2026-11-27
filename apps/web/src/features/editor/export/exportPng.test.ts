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
