import { describe, expect, it } from 'vitest';
import { extractCookie, toDocumentName, toInvitationId } from './collab.util';

describe('extractCookie', () => {
  it('여러 쿠키 중 이름이 일치하는 값을 찾는다', () => {
    expect(extractCookie('foo=1; access_token=abc.def.ghi; bar=2', 'access_token')).toBe(
      'abc.def.ghi',
    );
  });

  it('쿠키 헤더가 없으면 null', () => {
    expect(extractCookie(null, 'access_token')).toBeNull();
  });

  it('이름이 일치하는 쿠키가 없으면 null', () => {
    expect(extractCookie('foo=1; bar=2', 'access_token')).toBeNull();
  });
});

describe('documentName <-> invitationId', () => {
  it('invitationId를 documentName으로 변환한다', () => {
    expect(toDocumentName('abc-123')).toBe('invitation:abc-123');
  });

  it('documentName에서 invitationId를 추출한다', () => {
    expect(toInvitationId('invitation:abc-123')).toBe('abc-123');
  });
});
