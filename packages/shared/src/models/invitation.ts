export type Ratio = '9:16' | '4:5' | '1:1' | '16:9';

export type Background =
  | { type: 'color'; value: string }
  | { type: 'image'; value: string }; // value = Cloudinary URL

export interface Invitation {
  id: string;
  roomId: string;
  name: string;
  ratio: Ratio; // 생성 후 변경 불가
  background: Background;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  // 본문(블록)은 Yjs 문서로 실시간 채널 전달 — 공유 타입 아님
}

// POST /api/rooms/:id/invitations
export interface CreateInvitationRequest {
  name: string;
  ratio: Ratio;
  background: Background;
}

// PATCH /api/invitations/:id
export interface UpdateInvitationRequest {
  name?: string;
  background?: Background;
  thumbnailUrl?: string;
}
