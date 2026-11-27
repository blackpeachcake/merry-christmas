import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

// GET /api/db-health — 현재 바라보는 DB 연결 확인 (로컬=dev / 리얼=prod)
@ApiTags('health')
@Controller('db-health')
export class DbHealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'DB 연결 확인 (SELECT 1)' })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { db: 'ok' };
  }
}
