import { Controller, Get } from '@nestjs/common';
import { CurrentUser, type AuthSession } from '../../auth/auth.guard.js';
import { ForOrganizers } from '../organizer.guard.js';
import { DashboardService } from './dashboard.service.js';

@Controller('panel/dashboard')
@ForOrganizers()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get(@CurrentUser() user: AuthSession['user']) {
    return this.dashboard.dashboard(user.id);
  }
}
