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

  create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        provider: input.provider,
        providerUserId: input.providerUserId,
        nickname: input.nickname,
        imageUrl: input.imageUrl,
        termsAgreedAt: new Date(),
        termsVersion: input.termsVersion,
        // email 미저장 (의도적)
      },
    });
  }
}
