import { Controller, Delete, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { clearAuthCookies, ResLike } from '../auth/cookies';

interface ReqLike {
  userId?: string;
}

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Delete()
  @ApiOperation({ summary: '탈퇴 — 계정 삭제 (방장인 방은 소속 초대장까지 CASCADE 삭제)' })
  async remove(@Req() req: ReqLike, @Res() res: ResLike & { json(b: unknown): void }): Promise<void> {
    await this.users.remove(req.userId!);
    clearAuthCookies(res);
    res.json({});
  }
}
