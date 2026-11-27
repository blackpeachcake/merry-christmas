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
