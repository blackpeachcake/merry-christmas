import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import { CollabGateway } from './collab.gateway';

describe('CollabGateway', () => {
  let tokens: { verifyAccess: ReturnType<typeof vi.fn> };
  let invitations: { assertCanEdit: ReturnType<typeof vi.fn> };
  let prisma: { invitation: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } };
  let gateway: CollabGateway;

  beforeEach(() => {
    tokens = { verifyAccess: vi.fn() };
    invitations = { assertCanEdit: vi.fn() };
    prisma = { invitation: { findUnique: vi.fn(), update: vi.fn() } };
    gateway = new CollabGateway(tokens as any, invitations as any, prisma as any);
  });

  describe('authenticate', () => {
    it('access_token 쿠키가 없으면 거부한다', async () => {
      await expect(
        gateway.authenticate({ documentName: 'invitation:x', requestHeaders: new Headers() }),
      ).rejects.toThrow();
    });

    it('토큰이 유효하지 않으면 거부한다', async () => {
      tokens.verifyAccess.mockImplementation(() => {
        throw new Error('invalid');
      });
      const headers = new Headers({ cookie: 'access_token=bad' });
      await expect(
        gateway.authenticate({ documentName: 'invitation:x', requestHeaders: headers }),
      ).rejects.toThrow();
    });

    it('방 멤버가 아니면 거부한다', async () => {
      tokens.verifyAccess.mockReturnValue({ sub: 'stranger' });
      invitations.assertCanEdit.mockRejectedValue(new Error('forbidden'));
      const headers = new Headers({ cookie: 'access_token=good' });
      await expect(
        gateway.authenticate({ documentName: 'invitation:x', requestHeaders: headers }),
      ).rejects.toThrow();
    });

    it('멤버면 userId를 반환한다', async () => {
      tokens.verifyAccess.mockReturnValue({ sub: 'owner' });
      invitations.assertCanEdit.mockResolvedValue(undefined);
      const headers = new Headers({ cookie: 'access_token=good' });
      const result = await gateway.authenticate({
        documentName: 'invitation:x',
        requestHeaders: headers,
      });
      expect(result).toEqual({ userId: 'owner' });
      expect(invitations.assertCanEdit).toHaveBeenCalledWith('owner', 'x');
    });
  });

  describe('loadDocument', () => {
    it('yjsState가 있으면 문서에 복원한다', async () => {
      const source = new Y.Doc();
      source.getMap('meta').set('ratio', '1:1');
      const state = Buffer.from(Y.encodeStateAsUpdate(source));
      prisma.invitation.findUnique.mockResolvedValue({ yjsState: state });

      const document = new Y.Doc();
      const result = await gateway.loadDocument({ documentName: 'invitation:x', document });

      expect(result.getMap('meta').get('ratio')).toBe('1:1');
    });

    it('yjsState가 없으면 문서를 그대로 반환한다', async () => {
      prisma.invitation.findUnique.mockResolvedValue({ yjsState: null });
      const document = new Y.Doc();

      const result = await gateway.loadDocument({ documentName: 'invitation:x', document });

      expect(result).toBe(document);
    });
  });

  describe('storeDocument', () => {
    it('문서 상태를 인코딩해 yjsState로 저장한다', async () => {
      const document = new Y.Doc();
      document.getMap('meta').set('ratio', '1:1');

      await gateway.storeDocument({ documentName: 'invitation:x', document });

      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'x' },
        data: { yjsState: expect.any(Buffer) },
      });
    });
  });
});
