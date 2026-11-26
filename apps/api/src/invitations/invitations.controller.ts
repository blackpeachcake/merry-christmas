import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInvitationDto, InvitationDto, UpdateInvitationDto } from '../models/invitation.dto';

interface ReqLike {
  userId?: string;
  params: Record<string, string>;
}

@ApiTags('invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('rooms/:id/invitations')
  @ApiOperation({ summary: '초대장 생성 (방 멤버)' })
  @ApiOkResponse({ type: InvitationDto })
  create(@Req() req: ReqLike, @Body() dto: CreateInvitationDto) {
    return this.invitations.create(req.userId!, req.params.id, dto);
  }

  @Get('rooms/:id/invitations')
  @ApiOperation({ summary: '방의 초대장 목록 (방 멤버)' })
  @ApiOkResponse({ type: InvitationDto, isArray: true })
  listByRoom(@Req() req: ReqLike) {
    return this.invitations.listByRoom(req.userId!, req.params.id);
  }

  @Patch('invitations/:id')
  @ApiOperation({ summary: '초대장 메타 수정 (방 멤버, ratio 제외)' })
  @ApiOkResponse({ type: InvitationDto })
  update(@Req() req: ReqLike, @Body() dto: UpdateInvitationDto) {
    return this.invitations.update(req.userId!, req.params.id, dto);
  }

  @Delete('invitations/:id')
  @ApiOperation({ summary: '초대장 삭제 (방장만)' })
  remove(@Req() req: ReqLike) {
    return this.invitations.remove(req.userId!, req.params.id);
  }
}
