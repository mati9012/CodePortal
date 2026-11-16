import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, type AuthSession } from './auth.guard.js';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  @Get()
  me(@CurrentUser() user: AuthSession['user']) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
