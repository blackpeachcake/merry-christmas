import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateRoomRequest } from '@nacho/shared';
import { PrismaService } from '../prisma/prisma.service';
import { generateInviteCode } from '../common/invite-code';

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
}

