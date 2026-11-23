// FE/BE 공유 도메인 타입 — 단일 출처.
// BE 설계(Discussion #6) 데이터 모델과 1:1 대응.

export type BlockType = "text" | "image" | "sticker";
export type InvitationStatus = "draft" | "published";
export type MemberRole = "owner" | "editor";
export type RsvpStatus = "yes" | "no" | "maybe";

export interface InvitationBlock {
  id: string;
  invitationId: string;
  type: BlockType;
  textContent?: string; // type === 'text'
  imageUrl?: string; // type === 'image' | 'sticker'
  posOrder: number; // 인스타식 순서
  updatedBy: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  ownerId: string;
  title: string;
  bgImageUrl?: string;
  inviteCode: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationMember {
  invitationId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface Rsvp {
  id: string;
  invitationId: string;
  name: string;
  status: RsvpStatus;
  createdAt: string;
}
