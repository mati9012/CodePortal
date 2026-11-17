import type { GroupInput, StudentInput } from '@codeportal/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser, type AuthSession } from '../../auth/auth.guard.js';
import { ForOrganizers } from '../organizer.guard.js';
import { groupInput, studentImport, studentInput, uuid } from '../schemas.js';
import { GroupsService } from './groups.service.js';

type User = AuthSession['user'];

@Controller('panel/groups')
@ForOrganizers()
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.groups.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body({ schema: groupInput }) input: GroupInput,
  ) {
    return this.groups.create(user.id, input);
  }

  @Get(':id')
  detail(@CurrentUser() user: User, @Param('id', { schema: uuid }) id: string) {
    return this.groups.detail(user.id, id);
  }

  @Post(':id/students')
  addStudent(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Body({ schema: studentInput }) input: StudentInput,
  ) {
    return this.groups.addStudent(user, id, input);
  }

  @Post(':id/students/import')
  importStudents(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Body({ schema: studentImport }) input: { students: StudentInput[] },
  ) {
    return this.groups.importStudents(user, id, input.students);
  }

  @Post(':id/students/:studentId/invite')
  invite(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('studentId', { schema: uuid }) studentId: string,
  ) {
    return this.groups.invite(user, id, studentId);
  }

  @Delete(':id/students/:studentId')
  @HttpCode(204)
  async removeStudent(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('studentId', { schema: uuid }) studentId: string,
  ) {
    await this.groups.removeStudent(user.id, id, studentId);
  }
}
