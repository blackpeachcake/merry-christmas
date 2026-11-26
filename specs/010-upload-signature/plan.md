# 010 — plan

TokenService(`TOKEN_CONFIG`) 패턴 재사용: 서비스는 순수 config 객체를 주입받아 ConfigService 없이 단위 테스트 가능하게.

## `apps/api/src/models/upload.model.ts` (신규)
```ts
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}
```

## `apps/api/src/uploads/uploads.service.ts` (신규)
```ts
export const CLOUDINARY_CONFIG = 'CLOUDINARY_CONFIG';

@Injectable()
export class UploadsService {
  constructor(@Inject(CLOUDINARY_CONFIG) private readonly cfg: CloudinaryConfig) {}

  sign(): { signature: string; timestamp: number; apiKey: string; cloudName: string } {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`timestamp=${timestamp}${this.cfg.apiSecret}`)
      .digest('hex');
    return { signature, timestamp, apiKey: this.cfg.apiKey, cloudName: this.cfg.cloudName };
  }
}
```
Cloudinary 표준 서명 규칙(파라미터 알파벳순 join 후 api_secret 그대로 append, sha1 hex) — 파라미터가 `timestamp` 하나뿐이라 정렬 로직은 불필요.

## `apps/api/src/uploads/uploads.controller.ts` (신규)
`POST uploads/signature` (JwtAuthGuard) → `this.uploads.sign()` 위임, `{ signature, timestamp, apiKey, cloudName }` 반환.

## `apps/api/src/uploads/uploads.module.ts` (신규)
`AuthModule` import(JwtAuthGuard), `CLOUDINARY_CONFIG` factory(ConfigService에서 `CLOUDINARY_*` 3개 getOrThrow).

## 테스트
- `UploadsService.sign` (단위, DB 불필요) — 고정 config로 sha1 직접 계산한 기대값과 비교, timestamp가 현재 시각 근처인지 확인.
- `UploadsController` (mock service) — 위임 확인.

## 배포
Secret Manager에 `cloudinary-cloud-name`/`cloudinary-api-key`/`cloudinary-api-secret` 생성 + `gcloud run services update nacho-api --update-secrets=...` 1회 실행(기존 KAKAO/JWT와 동일, deploy.yml 변경 없음). `.env.example`에 로컬용 키 3개 추가.
