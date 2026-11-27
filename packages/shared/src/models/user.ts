// 공개 유저(FE 표시용) — provider/식별자/약관 등 내부정보 제외
export interface User {
  id: string;
  nickname: string;
  imageUrl?: string;
}

// PATCH /api/me
export interface UpdateUserRequest {
  nickname?: string;
  imageUrl?: string;
}
