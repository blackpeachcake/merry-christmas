export type MemberRole = 'owner' | 'member';
export type JoinStatus = 'pending' | 'approved' | 'rejected';

export const ROOM_MAX_MEMBERS = 8; // 방장 포함
export const MAX_REJECT_COUNT = 3;

export interface Room {
  id: string;
  name: string;
  thumbnailUrl?: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomMember {
  roomId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  roomId: string;
  userId: string;
  status: JoinStatus;
  rejectCount: number;
  createdAt: string;
  updatedAt: string;
}
