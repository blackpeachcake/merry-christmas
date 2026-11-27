import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { TokenService } from '../auth/token.service';
import { InvitationsService } from '../invitations/invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { extractCookie, toInvitationId } from './collab.util';

// 초대장 1개 = Y.Doc 1개(documentName = invitation:<id>). 쿠키(access_token)로 인증,
// 방 멤버인지 확인, invitation.yjs_state에 영속화. 단일 인스턴스 전제(ponytail: 멀티 인스턴스로
// 스케일아웃되면 Hocuspocus 인메모리 문서가 인스턴스별로 분리됨 — 늘면 @hocuspocus/extension-redis로 교체).
@Injectable()
export class CollabGateway implements OnModuleInit {
  private readonly hocuspocus: Hocuspocus;
  private readonly wss = new WebSocketServer({ noServer: true });

  constructor(
    private readonly tokens: TokenService,
    private readonly invitations: InvitationsService,
    private readonly prisma: PrismaService,
  ) {
    this.hocuspocus = new Hocuspocus({
      quiet: true,
      onAuthenticate: (data) => this.authenticate(data),
      onLoadDocument: (data) => this.loadDocument(data),
      onStoreDocument: (data) => this.storeDocument(data),
    });
  }

  onModuleInit(): void {
    // Hocuspocus 인스턴스 생성만으로는 리스닝하지 않음(listen() 호출 안 함) — main.ts가 upgrade 이벤트로 연결.
  }

  async authenticate({
    documentName,
    requestHeaders,
  }: {
    documentName: string;
    requestHeaders: Headers;
  }): Promise<{ userId: string }> {
    const token = extractCookie(requestHeaders.get('cookie'), 'access_token');
    if (!token) {
      throw new Error('인증이 필요합니다');
    }
    const { sub: userId } = this.tokens.verifyAccess(token);
    await this.invitations.assertCanEdit(userId, toInvitationId(documentName));
    return { userId };
  }

  async loadDocument({
    documentName,
    document,
  }: {
    documentName: string;
    document: Y.Doc;
  }): Promise<Y.Doc> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: toInvitationId(documentName) },
      select: { yjsState: true },
    });
    if (invitation?.yjsState) {
      Y.applyUpdate(document, invitation.yjsState);
    }
    return document;
  }

  async storeDocument({
    documentName,
    document,
  }: {
    documentName: string;
    document: Y.Doc;
  }): Promise<void> {
    const state = Buffer.from(Y.encodeStateAsUpdate(document));
    await this.prisma.invitation.update({
      where: { id: toInvitationId(documentName) },
      data: { yjsState: state },
    });
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      // handleConnection()은 ClientConnection만 만들 뿐, ws의 message/close 이벤트를
      // 자동으로 연결해주지 않음 — 직접 전달해야 함(Hocuspocus 내부 Server 클래스와 동일한 패턴).
      const connection = this.hocuspocus.handleConnection(ws, toWebRequest(request));
      ws.on('message', (data) => connection.handleMessage(toUint8Array(data)));
      ws.on('close', (code, reason) => connection.handleClose({ code, reason: reason.toString() }));
    });
  }
}

function toUint8Array(data: Buffer | ArrayBuffer | Buffer[]): Uint8Array {
  return new Uint8Array(Array.isArray(data) ? Buffer.concat(data) : data);
}

function toWebRequest(req: IncomingMessage): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  return new Request(`http://${req.headers.host}${req.url}`, { headers });
}
