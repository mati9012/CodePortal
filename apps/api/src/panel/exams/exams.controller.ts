import type {
  AddTimeInput,
  ExamDraft,
  ReviewInput,
} from '@codeportal/contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser, type AuthSession } from '../../auth/auth.guard.js';
import { ForOrganizers } from '../organizer.guard.js';
import {
  addTimeInput,
  examDraft,
  messageInput,
  reviewInput,
  uuid,
} from '../schemas.js';
import { ExamsService } from './exams.service.js';
import { LiveService } from './live.service.js';
import { ResultsService } from './results.service.js';

type User = AuthSession['user'];

@Controller('panel/exams')
@ForOrganizers()
export class ExamsController {
  constructor(
    private readonly exams: ExamsService,
    private readonly live: LiveService,
    private readonly results: ResultsService,
  ) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.exams.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body({ schema: examDraft }) draft: ExamDraft,
  ) {
    return this.exams.create(user.id, draft);
  }

  @Get(':id')
  detail(@CurrentUser() user: User, @Param('id', { schema: uuid }) id: string) {
    return this.live.detail(user.id, id);
  }

  @Get(':id/draft')
  draft(@CurrentUser() user: User, @Param('id', { schema: uuid }) id: string) {
    return this.exams.draft(user.id, id);
  }

  @Put(':id/draft')
  @HttpCode(204)
  async save(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Body({ schema: examDraft }) draft: ExamDraft,
  ) {
    await this.exams.save(user.id, id, draft);
  }

  @Post(':id/publish')
  publish(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
  ) {
    return this.exams.publish(user.id, id);
  }

  @Post(':id/duplicate')
  duplicate(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
  ) {
    return this.exams.duplicate(user.id, id);
  }

  @Post(':id/time')
  @HttpCode(204)
  async addTime(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Body({ schema: addTimeInput }) input: AddTimeInput,
  ) {
    await this.live.addTime(user.id, id, input);
  }

  @Post(':id/end')
  @HttpCode(204)
  async end(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
  ) {
    await this.live.endExam(user.id, id);
  }

  @Post(':id/sessions/:sessionId/readmit')
  @HttpCode(204)
  async readmit(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('sessionId', { schema: uuid }) sessionId: string,
  ) {
    await this.live.readmit(user.id, id, sessionId);
  }

  @Post(':id/sessions/:sessionId/end')
  @HttpCode(204)
  async endSession(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('sessionId', { schema: uuid }) sessionId: string,
  ) {
    await this.live.endSession(user.id, id, sessionId);
  }

  @Post(':id/sessions/:sessionId/message')
  @HttpCode(204)
  async message(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('sessionId', { schema: uuid }) sessionId: string,
    @Body({ schema: messageInput }) input: { text: string },
  ) {
    await this.live.message(user.id, id, sessionId, input.text);
  }

  @Get(':id/sessions/:sessionId/code')
  code(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('sessionId', { schema: uuid }) sessionId: string,
  ) {
    return this.live.code(user.id, id, sessionId);
  }

  @Get(':id/results')
  examResults(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
  ) {
    return this.results.results(user.id, id);
  }

  @Post(':id/results/approve')
  @HttpCode(204)
  async approve(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
  ) {
    await this.results.approve(user.id, id);
  }

  @Get(':id/results/:sessionId')
  report(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('sessionId', { schema: uuid }) sessionId: string,
  ) {
    return this.results.report(user.id, id, sessionId);
  }

  @Post(':id/results/:sessionId/review')
  @HttpCode(204)
  async review(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('sessionId', { schema: uuid }) sessionId: string,
    @Body({ schema: reviewInput }) input: ReviewInput,
  ) {
    await this.results.review(user.id, id, sessionId, input);
  }

  @Post(':id/results/:sessionId/flag')
  @HttpCode(204)
  async flag(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Param('sessionId', { schema: uuid }) sessionId: string,
  ) {
    await this.results.flag(user.id, id, sessionId);
  }
}
