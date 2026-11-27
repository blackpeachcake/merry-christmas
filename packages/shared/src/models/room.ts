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
  capacity: number; // 방장 포함 총원 (1~8)
  createdAt: string;
  updatedAt: string;
}

// POST /api/rooms
export interface CreateRoomRequest {
  name: string;
  thumbnailUrl?: string;
  capacity: number; // 1~8
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
