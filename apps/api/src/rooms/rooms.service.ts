import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateRoomRequest } from '@nacho/shared';
import { PrismaService } from '../prisma/prisma.service';
import { generateInviteCode } from '../common/invite-code';

const MAX_REJECT_COUNT = 3; // @nacho/shared의 동일 상수 — BE는 런타임 값을 shared에서 import하지 않음(타입만)

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateRoomRequest) {
    const name = input.name?.trim();
    if (!name || name.length > 30) {
      throw new BadRequestException('방 이름은 1~30자여야 합니다');
    }
    if (
      !Number.isInteger(input.capacity) ||
      input.capacity < 1 ||
      input.capacity > 8
    ) {
      throw new BadRequestException('정원은 1~8명이어야 합니다');
    }
    // 방 생성 + 생성자를 owner 멤버로 (한 트랜잭션)
    // ponytail: inviteCode 충돌 확률 ~0(62^8). 문제되면 P2002 재시도 추가.
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          name,
          thumbnailUrl: input.thumbnailUrl,
          ownerId: userId,
          inviteCode: generateInviteCode(),
          capacity: input.capacity,
        },
      });
      await tx.roomMember.create({
        data: { roomId: room.id, userId, role: 'owner' },
      });
      return room;
    });
  }

  // 내가 owner이거나 member인 방 (최신순)
  listMine(userId: string) {
    return this.prisma.room.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 비로그인 미리보기 — 이름만
  async preview(roomId: string): Promise<{ name: string }> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다');
    }
    return { name: room.name };
  }

  async joinByCode(userId: string, roomId: string, code: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.inviteCode !== code) {
      throw new BadRequestException('초대 코드가 올바르지 않습니다');
    }
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (member) {
      throw new ConflictException('이미 방의 멤버입니다');
    }
    const existing = await this.prisma.joinRequest.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (existing?.status === 'pending') {
      return;
    }
    if (existing && existing.rejectCount >= MAX_REJECT_COUNT) {
      throw new ForbiddenException('거절 횟수를 초과하여 재신청할 수 없습니다');
    }
    await this.prisma.joinRequest.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId, status: 'pending' },
      update: { status: 'pending' },
    });
    await this.prisma.notification.create({
      data: {
        userId: room.ownerId,
        type: 'join_requested',
        payload: { roomId, roomName: room.name, requesterId: userId },
      },
    });
  }

  listPendingRequests(roomId: string) {
    return this.prisma.joinRequest.findMany({
      where: { roomId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveRequest(roomId: string, reqId: string): Promise<void> {
    const req = await this.prisma.joinRequest.findUnique({ where: { id: reqId } });
    if (!req || req.roomId !== roomId || req.status !== 'pending') {
      throw new BadRequestException('처리할 수 없는 신청입니다');
    }
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
    const memberCount = await this.prisma.roomMember.count({ where: { roomId } });
    if (memberCount >= room.capacity) {
      throw new BadRequestException('방 정원이 가득 찼습니다');
    }
    await this.prisma.$transaction([
      this.prisma.roomMember.create({
        data: { roomId, userId: req.userId, role: 'member' },
      }),
      this.prisma.joinRequest.update({ where: { id: reqId }, data: { status: 'approved' } }),
    ]);
    await this.prisma.notification.create({
      data: {
        userId: req.userId,
        type: 'join_approved',
        payload: { roomId, roomName: room.name },
      },
    });
  }

  async rejectRequest(roomId: string, reqId: string): Promise<void> {
    const req = await this.prisma.joinRequest.findUnique({ where: { id: reqId } });
    if (!req || req.roomId !== roomId || req.status !== 'pending') {
      throw new BadRequestException('처리할 수 없는 신청입니다');
    }
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
    await this.prisma.joinRequest.update({
      where: { id: reqId },
      data: { status: 'rejected', rejectCount: { increment: 1 } },
    });
    await this.prisma.notification.create({
      data: {
        userId: req.userId,
        type: 'join_rejected',
        payload: { roomId, roomName: room.name },
      },
    });
  }

  async leave(userId: string, roomId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다');
    }
    if (room.ownerId === userId) {
      throw new ForbiddenException('방장은 나갈 수 없습니다. 방을 삭제해주세요');
    }
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) {
      throw new NotFoundException('방의 멤버가 아닙니다');
    }
    await this.prisma.roomMember.delete({ where: { roomId_userId: { roomId, userId } } });
  }

  // 호출 전 RoomOwnerGuard가 존재/방장 여부 확인 끝낸 상태.
  // JoinRequest/Invitation은 roomId가 relation이 아니라 수동 삭제 필요(007과 동일 패턴).
  async remove(roomId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.deleteMany({ where: { roomId } });
      await tx.joinRequest.deleteMany({ where: { roomId } });
      await tx.roomMember.deleteMany({ where: { roomId } });
      await tx.room.delete({ where: { id: roomId } });
    });
  }
}

