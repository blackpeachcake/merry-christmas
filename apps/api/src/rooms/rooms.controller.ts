import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRoomDto } from '../models/room.dto';

interface ReqLike {
  userId?: string;
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
}
