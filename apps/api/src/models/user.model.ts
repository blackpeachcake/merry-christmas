// 사용자 관련 타입

export interface CreateUserInput {
  provider: string;
  providerUserId: string;
  nickname: string;
  imageUrl?: string;
  termsVersion: string;
}
