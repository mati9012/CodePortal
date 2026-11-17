import type { ProblemInput } from '@codeportal/contracts';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CurrentUser, type AuthSession } from '../../auth/auth.guard.js';
import { ForOrganizers } from '../organizer.guard.js';
import { problemInput, uuid } from '../schemas.js';
import { ProblemsService } from './problems.service.js';

type User = AuthSession['user'];

@Controller('panel/problems')
@ForOrganizers()
export class ProblemsController {
  constructor(private readonly problems: ProblemsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.problems.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body({ schema: problemInput }) input: ProblemInput,
  ) {
    return this.problems.create(user.id, input);
  }

  @Get(':id')
  detail(@CurrentUser() user: User, @Param('id', { schema: uuid }) id: string) {
    return this.problems.detail(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Body({ schema: problemInput }) input: ProblemInput,
  ) {
    return this.problems.update(user.id, id, input);
  }
}
