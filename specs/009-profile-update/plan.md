# 009 — plan

## 공유 타입 (`packages/shared/src/models/user.ts`)
```ts
// PATCH /api/me
export interface UpdateUserRequest {
  nickname?: string;
  imageUrl?: string;
}
```

## DTO (`apps/api/src/models/user.dto.ts`, 신규)
`UpdateUserDto implements UpdateUserRequest` — `@ApiProperty({ required: false })` 둘 다.

## `UsersService.update(userId, input)` (신규 메서드)
- `input.nickname`과 `input.imageUrl` 둘 다 없으면 `BadRequestException`.
- `nickname` 있으면 trim 후 1~20자 아니면 `BadRequestException`.
- `prisma.user.update({ where: { id: userId }, data: { ...(nickname이 있으면 nickname), ...(imageUrl이 있으면 imageUrl) } })` 후 User 반환.

## `MeController` (기존 파일에 추가, 새 컨트롤러 안 만듦)
```ts
@Patch()
async update(@Req() req, @Body() dto: UpdateUserDto): Promise<User> {
  const user = await this.users.update(req.userId!, dto);
  return { id: user.id, nickname: user.nickname, imageUrl: user.imageUrl ?? undefined };
}
```
응답 매핑은 `AuthController.me`와 동일 패턴 재사용.

## 테스트
- `UsersService.update` (real DB): 닉네임만 변경 / 이미지만 변경 / 둘 다 없으면 400 / 빈 닉네임 400 / 21자 닉네임 400.
- `MeController.update` (mock service): req.userId+dto로 위임, 결과를 User shape로 매핑해 반환.
