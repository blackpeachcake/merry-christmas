// 쿠키 헤더 파싱 + invitationId <-> Yjs documentName 변환. 둘 다 순수 함수.

export function extractCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

const DOC_PREFIX = 'invitation:';

export function toDocumentName(invitationId: string): string {
  return `${DOC_PREFIX}${invitationId}`;
}

export function toInvitationId(documentName: string): string {
  return documentName.slice(DOC_PREFIX.length);
}
