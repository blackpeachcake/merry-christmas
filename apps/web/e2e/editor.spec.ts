import { expect, test } from "@playwright/test";

test("비율 → 배경 → 텍스트 추가 → 새로고침 후 유지 → PNG 저장", async ({ page, browserName }) => {
  await page.goto("/editor");

  await page.getByRole("button", { name: "9:16 스토리" }).click();
  await page.getByRole("button", { name: "#E53935" }).click();
  await page.getByRole("button", { name: "시작하기" }).click();

  const canvas = page.getByTestId("editor-canvas");
  await expect(canvas).toHaveAttribute("data-block-count", "0");

  await page.getByRole("button", { name: "텍스트 추가" }).click();
  await page.getByRole("textbox", { name: "텍스트 입력" }).fill("메리 크리스마스");
  await page.getByRole("button", { name: "완료" }).click();
  await expect(canvas).toHaveAttribute("data-block-count", "1");

  await page.reload();
  await expect(page.getByTestId("editor-canvas")).toHaveAttribute("data-block-count", "1");

  // WebKit은 공유 시트를 열 수 있어 다운로드 검증은 Chromium에서만 한다.
  // (test.skip을 쓰면 앞선 검증까지 skipped로 보고돼서 조건문으로 감싼다)
  if (browserName === "chromium") {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "이미지 저장" }).click();
    expect((await download).suggestedFilename()).toMatch(/^merry-\d+\.png$/);
  }
});

test("실행 취소·다시 실행으로 텍스트 추가를 되돌리고 되살린다", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "1:1 정사각형" }).click();
  await page.getByRole("button", { name: "시작하기" }).click();

  await page.getByRole("button", { name: "텍스트 추가" }).click();
  await page.getByRole("textbox", { name: "텍스트 입력" }).fill("지울 글자");
  await page.getByRole("button", { name: "완료" }).click();

  const canvas = page.getByTestId("editor-canvas");
  await expect(canvas).toHaveAttribute("data-block-count", "1");

  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(canvas).toHaveAttribute("data-block-count", "0");
  await page.getByRole("button", { name: "다시 실행" }).click();
  await expect(canvas).toHaveAttribute("data-block-count", "1");
});
