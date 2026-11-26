import { ApiProperty } from '@nestjs/swagger';
import type { TermsRequest } from '@nacho/shared';

// Swagger 스키마용 DTO — 공유 계약(TermsRequest)을 구현
// pendingToken은 httpOnly 쿠키로 전달되므로 바디엔 동의 여부만
export class TermsDto implements TermsRequest {
  @ApiProperty({ description: '이용약관 동의 (필수)' })
  agreeTerms!: boolean;

  @ApiProperty({ description: '개인정보 수집·이용 동의 (필수)' })
  agreePrivacy!: boolean;
}
