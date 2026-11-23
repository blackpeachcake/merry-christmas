import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("falsy 값을 제외하고 공백으로 합친다", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
