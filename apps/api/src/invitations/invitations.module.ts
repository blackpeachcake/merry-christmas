import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // JwtAuthGuard 사용
  controllers: [InvitationsController],
  providers: [InvitationsService, PrismaService],
  exports: [InvitationsService], // CollabModule 등에서 멤버 체크 재사용
})
export class InvitationsModule {}
