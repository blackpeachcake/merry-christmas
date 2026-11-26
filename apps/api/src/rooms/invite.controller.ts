import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';

interface ReqLike {
  params: { roomId: string };
}

// 비로그인 허용 — 카톡 링크 미리보기(OG)용. 방 이름만 노출.
@ApiTags('invite')
@Controller('invite')
export class InviteController {
  constructor(private readonly rooms: RoomsService) {}

  @Get(':roomId')
  @ApiOperation({ summary: '방 미리보기 (비로그인, 이름만)' })
  preview(@Req() req: ReqLike) {
    return this.rooms.preview(req.params.roomId);
  }
}
