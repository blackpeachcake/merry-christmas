import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TEXT_DRAFT } from "../model/constants";
import { TextComposer } from "./TextComposer";

vi.mock("../media/fonts", () => ({
  FONTS: {
    pretendard: { label: "기본", family: "sans-serif" },
    "gowun-batang": { label: "명조", family: "serif" },
    jua: { label: "동글", family: "sans-serif" },
    "black-han-sans": { label: "굵게", family: "sans-serif" },
    "nanum-pen": { label: "손글씨", family: "cursive" },
  },
}));

describe("TextComposer", () => {
  it("입력한 내용과 고른 스타일로 onDone을 부른다", () => {
    const onDone = vi.fn();
    render(<TextComposer initial={DEFAULT_TEXT_DRAFT} onDone={onDone} />);

    fireEvent.change(screen.getByRole("textbox", { name: "텍스트 입력" }), {
      target: { value: "메리 크리스마스" },
    });
    fireEvent.click(screen.getByRole("button", { name: "손글씨" }));
    fireEvent.click(screen.getByRole("button", { name: "색 #E53935" }));
    fireEvent.click(screen.getByRole("button", { name: "정렬: 가운데" }));
    fireEvent.click(screen.getByRole("button", { name: "글자 배경: 없음" }));
    fireEvent.click(screen.getByRole("button", { name: "완료" }));

    expect(onDone).toHaveBeenCalledWith({
      ...DEFAULT_TEXT_DRAFT,
      text: "메리 크리스마스",
      fontId: "nanum-pen",
      color: "#E53935",
      align: "right",
      textBg: "solid",
    });
  });

  it("기존 값으로 시작한다", () => {
    render(<TextComposer initial={{ ...DEFAULT_TEXT_DRAFT, text: "기존" }} onDone={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "텍스트 입력" })).toHaveValue("기존");
  });

  it("글자 크기 슬라이더 값이 반영된다", () => {
    const onDone = vi.fn();
    render(<TextComposer initial={{ ...DEFAULT_TEXT_DRAFT, text: "a" }} onDone={onDone} />);
    fireEvent.change(screen.getByRole("slider", { name: "글자 크기" }), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByRole("button", { name: "완료" }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ fontSize: 150 }));
  });

  // 포커스가 입력 칸을 떠나면 macOS 이모지 선택 창 등에서 넣은 문자가 들어갈 곳이 없다.
  it("스타일 버튼·슬라이더를 써도 커서가 입력 칸에 남는다", () => {
    render(<TextComposer initial={DEFAULT_TEXT_DRAFT} onDone={vi.fn()} />);
    const textbox = screen.getByRole("textbox", { name: "텍스트 입력" });

    for (const name of ["손글씨", "색 #E53935", "정렬: 가운데", "글자 배경: 없음"]) {
      const button = screen.getByRole("button", { name });
      button.focus();
      fireEvent.click(button);
      expect(document.activeElement).toBe(textbox);
    }

    const slider = screen.getByRole("slider", { name: "글자 크기" });
    slider.focus();
    fireEvent.change(slider, { target: { value: "120" } });
    fireEvent.pointerUp(slider);
    expect(document.activeElement).toBe(textbox);
  });

  it("버튼을 누르는 순간(mousedown) 포커스를 빼앗지 않는다", () => {
    render(<TextComposer initial={DEFAULT_TEXT_DRAFT} onDone={vi.fn()} />);
    const event = fireEvent.mouseDown(screen.getByRole("button", { name: "손글씨" }));
    // fireEvent는 기본 동작이 막혔으면 false를 돌려준다
    expect(event).toBe(false);
  });
});
