import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

// GET /api/health — readiness/liveness probe 용 (#7)
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '헬스체크' })
  check() {
    return { status: 'ok', ts: new Date().toISOString() };
  }
}
