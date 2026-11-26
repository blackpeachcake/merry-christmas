import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// :id(roomId)의 방장인지 확인. 방 없으면 404, 방장 아니면 403.
@Injectable()
export class RoomOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const room = await this.prisma.room.findUnique({ where: { id: req.params.id } });
    if (!room) {
      throw new NotFoundException('방을 찾을 수 없습니다');
    }
    if (room.ownerId !== req.userId) {
      throw new ForbiddenException('방장만 가능합니다');
    }
    return true;
  }
}
