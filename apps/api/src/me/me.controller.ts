import { Body, Controller, Delete, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@nacho/shared';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { clearAuthCookies, ResLike } from '../auth/cookies';
import { UpdateUserDto } from '../models/user.dto';

interface ReqLike {
  userId?: string;
}

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  @ApiOperation({ summary: '프로필 수정 (닉네임/이미지, 최소 1개)' })
  async update(@Req() req: ReqLike, @Body() dto: UpdateUserDto): Promise<User> {
    const user = await this.users.update(req.userId!, dto);
    return { id: user.id, nickname: user.nickname, imageUrl: user.imageUrl ?? undefined };
  }

  @Delete()
  @ApiOperation({ summary: '탈퇴 — 계정 삭제 (방장인 방은 소속 초대장까지 CASCADE 삭제)' })
  async remove(@Req() req: ReqLike, @Res() res: ResLike & { json(b: unknown): void }): Promise<void> {
    await this.users.remove(req.userId!);
    clearAuthCookies(res);
    res.json({});
  }
}
