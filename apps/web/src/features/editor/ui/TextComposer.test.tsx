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
});
