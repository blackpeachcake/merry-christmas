import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasPasteLayer } from "./CanvasPasteLayer";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m) } }));

beforeEach(() => vi.clearAllMocks());

const layer = () => screen.getByRole("textbox", { name: "캔버스 붙여넣기" });

describe("CanvasPasteLayer", () => {
  it("꾹 눌러 휴대폰 [붙여넣기] 메뉴를 띄울 수 있게 편집 가능 요소이고, 키보드는 띄우지 않는다", () => {
    render(<CanvasPasteLayer />);
    expect(layer()).toHaveAttribute("contenteditable", "true");
    expect(layer()).toHaveAttribute("inputmode", "none");
  });

  // 이미지는 화면 전체 붙여넣기 처리(EditorScreen)가 받도록 그대로 올려 보낸다.
  it("이미지를 붙여넣으면 막지 않고 위로 전달한다", () => {
    render(<CanvasPasteLayer />);
    const file = new File(["png"], "cutout.png", { type: "image/png" });
    const event = createEvent.paste(layer(), {
      clipboardData: { items: [{ kind: "file", type: "image/png", getAsFile: () => file }] },
    });
    fireEvent(layer(), event);
    expect(event.defaultPrevented).toBe(false);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("이미지가 아닌 것을 붙여넣으면 막고 안내한다", () => {
    render(<CanvasPasteLayer />);
    const event = createEvent.paste(layer(), {
      clipboardData: { items: [{ kind: "string", type: "text/plain" }] },
    });
    fireEvent(layer(), event);
    expect(event.defaultPrevented).toBe(true);
    expect(toastError).toHaveBeenCalledWith("복사된 이미지가 없어요");
  });

  it("글자 입력은 막는다", () => {
    render(<CanvasPasteLayer />);
    const event = createEvent(
      "beforeinput",
      layer(),
      // 실제 브라우저의 beforeinput처럼 취소 가능하게 만든다
      { inputType: "insertText", data: "a", bubbles: true, cancelable: true },
      { EventType: "InputEvent" },
    );
    fireEvent(layer(), event);
    expect(event.defaultPrevented).toBe(true);
  });
});
