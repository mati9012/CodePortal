import {
  applyDecorators,
  ForbiddenException,
  Injectable,
  UseGuards,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, type AuthSession } from '../auth/auth.guard.js';

const ORGANIZER_ROLES = new Set(['organizer', 'admin']);

@Injectable()
export class OrganizerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { auth?: AuthSession }>();
    if (!ORGANIZER_ROLES.has(req.auth?.user.role ?? ''))
      throw new ForbiddenException();
    return true;
  }
}

export const ForOrganizers = () =>
  applyDecorators(UseGuards(AuthGuard, OrganizerGuard));
