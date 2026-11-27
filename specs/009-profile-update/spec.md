# 009 — 프로필 수정 (BE)

상태: **구현 완료** · 출처: [#12 기획](https://github.com/blackpeachcake/nacho/discussions/12) · [#6 BE 설계](https://github.com/blackpeachcake/nacho/discussions/6)

## 1. 무엇을 / 왜

가입 시 소셜에서 자동 세팅된 닉네임·프로필이미지를 사용자가 **마이페이지에서 수정**할 수 있게 한다(#12 "닉네임 변경, 이미지 변경"). 001에서 범위 밖으로 미뤄둔 부분.

## 2. 범위 (이 스펙)

- BE만. `PATCH /api/me` (닉네임/이미지 URL 부분 수정, 기존 `MeController`에 추가).
- imageUrl은 이미 업로드된 URL을 받는다 — Cloudinary presigned 업로드 자체는 범위 밖(다음 스펙).

## 3. 수용 기준 (Acceptance Criteria)

- [x] `PATCH /api/me` (Jwt)
  - body: `{ nickname?, imageUrl? }` (둘 다 optional, 최소 1개 — 아무것도 없으면 400)
  - 닉네임 보내면 1~20자 trim, 빈 문자열 400
  - 성공 시 갱신된 `User`(id/nickname/imageUrl) 200 반환

## 4. 범위 밖 (나중)

Cloudinary presigned 업로드, 약관 재동의.
