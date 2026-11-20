import {
  createParamDecorator,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { sessionIdFromToken } from './exam-token.js';

const BEARER = 'Bearer ';
const SESSION_EXPIRED = 'Sesja testu wygasła. Otwórz link do testu ponownie.';

type ExamRequest = Request & { examSessionId?: string };

@Injectable()
export class ExamSessionGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<ExamRequest>();
    const header = req.headers.authorization ?? '';
    const sessionId = header.startsWith(BEARER)
      ? sessionIdFromToken(
          header.slice(BEARER.length),
          this.config.getOrThrow<string>('BETTER_AUTH_SECRET'),
        )
      : null;
    if (!sessionId) throw new UnauthorizedException(SESSION_EXPIRED);
    req.examSessionId = sessionId;
    return true;
  }
}

export const ExamSessionId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<ExamRequest>().examSessionId!,
);
