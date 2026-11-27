import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from '../models/user.model';
import type { UpdateUserRequest } from '@nacho/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByProvider(provider: string, providerUserId: string) {
    return this.prisma.user.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  bumpTokenVersion(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        provider: input.provider,
        providerUserId: input.providerUserId,
        nickname: input.nickname,
        imageUrl: input.imageUrl,
        termsAgreedAt: new Date(), // 약관 동의 시점(= 동의 여부)
        // email 미저장 (의도적)
      },
    });
  }

  async update(userId: string, input: UpdateUserRequest) {
    if (input.nickname === undefined && input.imageUrl === undefined) {
      throw new BadRequestException('수정할 항목이 없습니다');
    }
    const nickname = input.nickname?.trim();
    if (input.nickname !== undefined && (!nickname || nickname.length > 20)) {
      throw new BadRequestException('닉네임은 1~20자여야 합니다');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      },
    });
  }

  // 탈퇴: owner인 방은 방+소속 invitation/join_request/room_member까지 CASCADE 삭제(#6 결정).
  // JoinRequest/Invitation은 roomId가 Prisma relation이 아니라 수동 삭제 필요.
  async remove(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const ownedRooms = await tx.room.findMany({ where: { ownerId: userId } });
      const ownedRoomIds = ownedRooms.map((r) => r.id);

      await tx.invitation.deleteMany({ where: { roomId: { in: ownedRoomIds } } });
      await tx.joinRequest.deleteMany({ where: { roomId: { in: ownedRoomIds } } });
      await tx.roomMember.deleteMany({ where: { roomId: { in: ownedRoomIds } } });
      await tx.room.deleteMany({ where: { id: { in: ownedRoomIds } } });

      await tx.roomMember.deleteMany({ where: { userId } });
      await tx.joinRequest.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }
}
