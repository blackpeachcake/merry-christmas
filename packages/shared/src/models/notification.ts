export type NotificationType =
  | 'join_requested' // 방장: 참여 요청 도착
  | 'join_approved' // 요청자: 승인됨
  | 'join_rejected'; // 요청자: 거절됨

export interface Notification {
  id: string;
  userId: string; // 수신자
  type: NotificationType;
  payload: Record<string, unknown>; // { roomId, roomName, requesterId, ... }
  readAt?: string;
  createdAt: string;
}
