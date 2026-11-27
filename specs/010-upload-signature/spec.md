# 010 — Cloudinary presigned 업로드 (BE)

상태: **구현 완료** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12) · [#6 BE 설계](https://github.com/blackpeachcake/nacho/discussions/6)

## 1. 무엇을 / 왜

프로필 이미지(009) · 초대장 배경/썸네일(006) 업로드 시, 파일을 BE 서버로 보내지 않고 **FE가 Cloudinary로 직접 업로드**하게 한다. BE는 그 업로드 요청에 필요한 서명(signature)만 발급한다.

## 2. 범위 (이 스펙)

- BE만. `POST /api/uploads/signature` (Jwt) — 서명 발급 1개 엔드포인트.
- Cloudinary SDK 의존성 추가 없이 `node:crypto`로 서명 생성(표준 sha1 서명 알고리즘, 라이브러리 불필요).
- 실제 파일 업로드는 FE→Cloudinary 직접 호출(BE 경유 안 함) — FE 작업.

## 3. 수용 기준 (Acceptance Criteria)

- [x] `POST /api/uploads/signature` (Jwt)
  - 응답: `{ signature, timestamp, apiKey, cloudName }`
  - `timestamp`는 서버 현재 시각(유닉스 초), `signature`는 `sha1(timestamp=...&api_secret=...)` 형태로 파라미터 알파벳순 정렬 후 해시 (Cloudinary 표준 서명 규칙)
  - 미인증 시 401

## 4. 환경변수 (Secret Manager)

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — 로컬은 `.env`, prod는 Secret Manager + Cloud Run 서비스에 1회 `--update-secrets`로 연결(배포 워크플로우가 매번 설정하지 않음, 기존 KAKAO/JWT 시크릿과 동일 패턴).

## 5. 범위 밖 (나중)

업로드 폴더/프리셋 세분화, 업로드 결과 검증(webhook).
