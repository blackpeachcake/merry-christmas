import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomOwnerGuard } from './room-owner.guard';
import { CreateRoomDto } from '../models/room.dto';
import { JoinRoomDto } from '../models/join-room.dto';

interface ReqLike {
  userId?: string;
  params: Record<string, string>;
}

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post()
  @ApiOperation({ summary: '방 만들기 (정원 1~8, 방장 포함). 생성자가 방장이 됨' })
  create(@Req() req: ReqLike, @Body() dto: CreateRoomDto) {
    return this.rooms.create(req.userId!, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 방 목록 (내가 owner이거나 member)' })
  listMine(@Req() req: ReqLike) {
    return this.rooms.listMine(req.userId!);
  }

  @Post(':id/join')
  @ApiOperation({ summary: '초대 코드로 가입 신청' })
  join(@Req() req: ReqLike, @Body() dto: JoinRoomDto) {
    return this.rooms.joinByCode(req.userId!, req.params.id, dto.code);
  }

  @Get(':id/requests')
  @UseGuards(RoomOwnerGuard)
  @ApiOperation({ summary: '가입 신청 목록 (방장만)' })
  listRequests(@Req() req: ReqLike) {
    return this.rooms.listPendingRequests(req.params.id);
  }

  @Post(':id/requests/:reqId/approve')
  @UseGuards(RoomOwnerGuard)
  @ApiOperation({ summary: '가입 신청 승인 (방장만)' })
  approve(@Req() req: ReqLike) {
    return this.rooms.approveRequest(req.params.id, req.params.reqId);
  }

  @Post(':id/requests/:reqId/reject')
  @UseGuards(RoomOwnerGuard)
  @ApiOperation({ summary: '가입 신청 거절 (방장만)' })
  reject(@Req() req: ReqLike) {
    return this.rooms.rejectRequest(req.params.id, req.params.reqId);
  }
}
