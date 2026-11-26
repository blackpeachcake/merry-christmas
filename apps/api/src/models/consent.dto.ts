import { ApiProperty } from '@nestjs/swagger';
import type { ConsentRequest } from '@nacho/shared';

// Swagger 스키마용 DTO — 공유 계약(ConsentRequest)을 구현
export class ConsentDto implements ConsentRequest {
  @ApiProperty({ description: '신규 로그인 시 발급된 약관동의 대기 토큰(pending JWT)' })
  pendingToken!: string;

  @ApiProperty({ description: '이용약관 동의 (필수)' })
  agreeTerms!: boolean;

  @ApiProperty({ description: '개인정보 수집·이용 동의 (필수)' })
  agreePrivacy!: boolean;
}
