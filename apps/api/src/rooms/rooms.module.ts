import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { InviteController } from './invite.controller';
import { RoomsService } from './rooms.service';
import { RoomOwnerGuard } from './room-owner.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // JwtAuthGuard + TokenService 사용
  controllers: [RoomsController, InviteController],
  providers: [RoomsService, RoomOwnerGuard, PrismaService],
})
export class RoomsModule {}
