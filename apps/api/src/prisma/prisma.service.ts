import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// 부팅 시 연결하지 않음(lazy) — DB 미연결이어도 앱은 뜨고, 첫 쿼리에서 연결.
@Injectable()
export class PrismaService extends PrismaClient {}
