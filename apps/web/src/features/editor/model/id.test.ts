import { webcrypto } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createId } from "./id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("createId", () => {
  // http://192.168.x.x 처럼 보안 연결이 아니면 crypto.randomUUID가 없다(휴대폰 개발 접속에서 발생).
  it("randomUUID가 없는 환경에서도 UUID v4 형식 id를 만든다", () => {
    const insecureCrypto = { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) };
    const id = createId(insecureCrypto);
    expect(id).toMatch(UUID_V4);
  });

  it("매번 다른 id를 만든다", () => {
    const insecureCrypto = { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) };
    const ids = new Set(Array.from({ length: 1000 }, () => createId(insecureCrypto)));
    expect(ids.size).toBe(1000);
  });

  it("기본값은 전역 crypto를 쓴다", () => {
    expect(createId()).toMatch(UUID_V4);
  });
});
