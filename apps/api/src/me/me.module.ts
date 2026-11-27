import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // JwtAuthGuard 사용
  controllers: [MeController],
  providers: [UsersService, PrismaService],
})
export class MeModule {}
