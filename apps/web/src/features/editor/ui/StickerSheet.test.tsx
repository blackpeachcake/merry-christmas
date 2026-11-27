import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickerSheet } from "./StickerSheet";

const loadImageFile = vi.fn();
const readClipboardImage = vi.fn();
const toastError = vi.fn();

vi.mock("../media/loadImage", () => ({ loadImageFile: (f: Blob) => loadImageFile(f) }));
vi.mock("../media/clipboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../media/clipboard")>()),
  readClipboardImage: () => readClipboardImage(),
}));
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m) } }));

const image = { src: "data:x", width: 10, height: 20 };
const LONG_PRESS_HINT = "캔버스를 꾹 눌러 [붙여넣기]를 눌러 주세요";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("StickerSheet", () => {
  it("[붙여넣기] 버튼: 클립보드 이미지를 읽으면 onPicked를 부른다", async () => {
    const blob = new Blob(["x"], { type: "image/png" });
    readClipboardImage.mockResolvedValue({ ok: true, blob });
    loadImageFile.mockResolvedValue(image);
    const onPicked = vi.fn();

    render(<StickerSheet open onClose={vi.fn()} onPicked={onPicked} />);
    fireEvent.click(screen.getByRole("button", { name: "붙여넣기" }));

    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(image));
    expect(loadImageFile).toHaveBeenCalledWith(blob);
  });

  it("[붙여넣기] 버튼: 클립보드에 이미지가 없으면 안내한다", async () => {
    readClipboardImage.mockResolvedValue({ ok: false, reason: "empty" });
    render(<StickerSheet open onClose={vi.fn()} onPicked={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "붙여넣기" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("복사된 이미지가 없어요"));
  });

  // http 접속·인앱 브라우저처럼 클립보드 API가 막힌 환경
  it("[붙여넣기] 버튼: 클립보드 API가 막히면 앨범을 열지 않고 시트를 닫은 뒤 캔버스 꾹 누르기를 안내한다", async () => {
    readClipboardImage.mockResolvedValue({ ok: false, reason: "unsupported" });
    const openFilePicker = vi.spyOn(HTMLInputElement.prototype, "click");
    const onClose = vi.fn();
    render(<StickerSheet open onClose={onClose} onPicked={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "붙여넣기" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(LONG_PRESS_HINT));
    expect(onClose).toHaveBeenCalled();
    expect(openFilePicker).not.toHaveBeenCalled();
  });

  it("시트 안에는 별도 붙여넣기 칸이 없다(캔버스를 꾹 눌러 붙여넣는다)", () => {
    render(<StickerSheet open onClose={vi.fn()} onPicked={vi.fn()} />);
    expect(screen.queryByRole("textbox", { name: "붙여넣기 칸" })).not.toBeInTheDocument();
  });
});
