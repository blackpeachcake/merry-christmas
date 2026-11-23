import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals를 쓰지 않으므로 Testing Library의 자동 정리가 동작하지 않는다.
// 테스트마다 렌더한 화면을 직접 정리한다.
afterEach(() => {
  cleanup();
});
