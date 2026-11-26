import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from '../models/user.model';

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
}
