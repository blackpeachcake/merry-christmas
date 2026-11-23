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
const LONG_PRESS_HINT = "아래 칸을 길게 눌러 [붙여넣기]를 눌러 주세요";

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
  it("[붙여넣기] 버튼: 클립보드 API가 막히면 앨범을 열지 않고 붙여넣기 칸을 안내한다", async () => {
    readClipboardImage.mockResolvedValue({ ok: false, reason: "unsupported" });
    const openFilePicker = vi.spyOn(HTMLInputElement.prototype, "click");
    render(<StickerSheet open onClose={vi.fn()} onPicked={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "붙여넣기" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(LONG_PRESS_HINT));
    expect(openFilePicker).not.toHaveBeenCalled();
  });

  it("붙여넣기 칸: 휴대폰 기본 [붙여넣기]로 들어온 이미지로 onPicked를 부른다", async () => {
    loadImageFile.mockResolvedValue(image);
    const onPicked = vi.fn();
    render(<StickerSheet open onClose={vi.fn()} onPicked={onPicked} />);

    const file = new File(["png"], "cutout.png", { type: "image/png" });
    fireEvent.paste(screen.getByRole("textbox", { name: "붙여넣기 칸" }), {
      clipboardData: { items: [{ kind: "file", type: "image/png", getAsFile: () => file }] },
    });

    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(image));
    expect(loadImageFile).toHaveBeenCalledWith(file);
  });

  it("붙여넣기 칸: 이미지가 아닌 것을 붙여넣으면 안내한다", () => {
    render(<StickerSheet open onClose={vi.fn()} onPicked={vi.fn()} />);
    fireEvent.paste(screen.getByRole("textbox", { name: "붙여넣기 칸" }), {
      clipboardData: { items: [{ kind: "string", type: "text/plain" }] },
    });
    expect(toastError).toHaveBeenCalledWith("복사된 이미지가 없어요");
  });
});
