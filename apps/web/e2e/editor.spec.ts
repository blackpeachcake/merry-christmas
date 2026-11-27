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

// 터치 이벤트를 직접 보내야 해서 Chromium(CDP)에서만 확인한다.
test("빈 캔버스를 짧게 탭하면 텍스트 입력이 열리고, 꾹 누르면 열리지 않는다", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "CDP 터치 이벤트는 Chromium 전용");
  await page.goto("/editor");
  await page.getByRole("button", { name: "1:1 정사각형" }).click();
  await page.getByRole("button", { name: "시작하기" }).click();

  const cdp = await page.context().newCDPSession(page);
  const box = (await page.getByTestId("editor-canvas").boundingBox())!;
  const point = { x: box.x + 60, y: box.y + 60 };
  const press = async (ms: number) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await page.waitForTimeout(ms);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const composer = page.getByRole("dialog", { name: "텍스트 편집" });

  await press(700);
  await page.waitForTimeout(300);
  await expect(composer).toHaveCount(0);

  await press(80);
  await expect(composer).toBeVisible();
});
