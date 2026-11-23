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
