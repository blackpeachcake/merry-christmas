import { describe, expect, it } from "vitest";
import { pickOutputType } from "./loadImage";

describe("pickOutputType", () => {
  it("JPEG만 JPEG로 유지하고 나머지는 투명도를 지키도록 PNG로 바꾼다", () => {
    expect(pickOutputType("image/jpeg")).toBe("image/jpeg");
    expect(pickOutputType("image/png")).toBe("image/png");
    expect(pickOutputType("image/webp")).toBe("image/png");
    expect(pickOutputType("image/heic")).toBe("image/png");
    expect(pickOutputType("")).toBe("image/png");
  });
});
