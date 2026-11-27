import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { PrismaService } from '../prisma/prisma.service';
import { CollabGateway } from './collab.gateway';

@Module({
  imports: [AuthModule, InvitationsModule],
  providers: [CollabGateway, PrismaService],
  exports: [CollabGateway],
})
export class CollabModule {}
