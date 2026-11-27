import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TopBar } from "./TopBar";

const props = () => ({
  hidden: false,
  canUndo: true,
  canRedo: false,
  exporting: false,
  onClose: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onBackground: vi.fn(),
  onText: vi.fn(),
  onSticker: vi.fn(),
  onExport: vi.fn(),
});

describe("TopBar", () => {
  it("버튼마다 해당 콜백을 부른다", () => {
    const p = props();
    render(<TopBar {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
    fireEvent.click(screen.getByRole("button", { name: "배경" }));
    fireEvent.click(screen.getByRole("button", { name: "텍스트 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "스티커 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "이미지 저장" }));
    fireEvent.click(screen.getByRole("button", { name: "새로 만들기" }));
    expect(p.onUndo).toHaveBeenCalled();
    expect(p.onBackground).toHaveBeenCalled();
    expect(p.onText).toHaveBeenCalled();
    expect(p.onSticker).toHaveBeenCalled();
    expect(p.onExport).toHaveBeenCalled();
    expect(p.onClose).toHaveBeenCalled();
  });

  it("되돌릴 수 없으면 버튼이 비활성화된다", () => {
    render(<TopBar {...props()} />);
    expect(screen.getByRole("button", { name: "다시 실행" })).toBeDisabled();
  });

  it("hidden이면 화면에서 숨긴다", () => {
    render(<TopBar {...props()} hidden />);
    expect(screen.queryByRole("button", { name: "실행 취소" })).not.toBeInTheDocument();
  });
});
