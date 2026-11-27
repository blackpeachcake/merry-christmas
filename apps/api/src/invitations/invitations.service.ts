import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateInvitationRequest, UpdateInvitationRequest } from '@nacho/shared';
import { PrismaService } from '../prisma/prisma.service';

const RATIOS = ['9:16', '4:5', '1:1', '16:9'];

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMember(userId: string, roomId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다');
    }
    if (room.ownerId === userId) {
      return;
    }
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('방 멤버만 가능합니다');
    }
  }

  async create(userId: string, roomId: string, input: CreateInvitationRequest) {
    await this.assertMember(userId, roomId);
    if (!RATIOS.includes(input.ratio)) {
      throw new BadRequestException('지원하지 않는 비율입니다');
    }
    return this.prisma.invitation.create({
      data: {
        roomId,
        name: input.name,
        ratio: input.ratio,
        background: input.background,
      },
    });
  }

  async listByRoom(userId: string, roomId: string) {
    await this.assertMember(userId, roomId);
    return this.prisma.invitation.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assertCanEdit(userId: string, invitationId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) {
      throw new NotFoundException('초대장을 찾을 수 없습니다');
    }
    await this.assertMember(userId, invitation.roomId);
  }

  async update(userId: string, invitationId: string, patch: UpdateInvitationRequest) {
    await this.assertCanEdit(userId, invitationId);
    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        name: patch.name,
        background: patch.background,
        thumbnailUrl: patch.thumbnailUrl,
      },
    });
  }

  async remove(userId: string, invitationId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) {
      throw new NotFoundException('초대장을 찾을 수 없습니다');
    }
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: invitation.roomId } });
    if (room.ownerId !== userId) {
      throw new ForbiddenException('방장만 삭제할 수 있습니다');
    }
    await this.prisma.invitation.delete({ where: { id: invitationId } });
  }
}
