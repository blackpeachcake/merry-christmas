/**
 * 블록 id(UUID v4)를 만든다.
 *
 * crypto.randomUUID는 보안 연결(https·localhost)에서만 있어서, 휴대폰으로
 * http://192.168.x.x 개발 서버에 접속하면 없다. 보안 연결이 아니어도 쓸 수 있는
 * crypto.getRandomValues로 만든다.
 */
export function createId(cryptoLike: Pick<Crypto, "getRandomValues"> = globalThis.crypto): string {
  const bytes = cryptoLike.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
