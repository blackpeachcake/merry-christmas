import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupFlow } from "./SetupFlow";

vi.mock("../media/loadImage", () => ({ loadImageFile: vi.fn() }));

describe("SetupFlow", () => {
  it("비율 → 배경 색 → 시작하기 순서로 고르면 onComplete를 부른다", () => {
    const onComplete = vi.fn();
    render(<SetupFlow onComplete={onComplete} />);

    expect(screen.getByRole("heading", { name: "비율을 골라 주세요" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "4:5 세로" }));

    expect(screen.getByRole("heading", { name: "배경을 골라 주세요" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "#E53935" }));
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    expect(onComplete).toHaveBeenCalledWith("4:5", { type: "color", color: "#E53935" });
  });

  it("배경 단계에서 뒤로 가면 비율을 다시 고를 수 있다", () => {
    render(<SetupFlow onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "9:16 스토리" }));
    fireEvent.click(screen.getByRole("button", { name: "비율 다시 고르기" }));
    expect(screen.getByRole("heading", { name: "비율을 골라 주세요" })).toBeInTheDocument();
  });
});
