import type {
  ExamEventInput,
  JoinInput,
  SaveCodeInput,
} from '@codeportal/contracts';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ExamSessionGuard, ExamSessionId } from './exam-session.guard.js';
import {
  eventsInput,
  joinCodeParam,
  joinInput,
  saveCodeInput,
} from './schemas.js';
import { StudentService } from './student.service.js';

const NO_CONTENT = 204;

@Controller('exam')
export class ExamEntryController {
  constructor(private readonly student: StudentService) {}

  @Get(':code')
  intro(@Param('code', { schema: joinCodeParam }) code: string) {
    return this.student.intro(code);
  }

  @Post(':code/join')
  join(
    @Param('code', { schema: joinCodeParam }) code: string,
    @Body({ schema: joinInput }) input: JoinInput,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.student.join(code, input, { ip, userAgent });
  }
}

@Controller('exam-session')
@UseGuards(ExamSessionGuard)
export class ExamSessionController {
  constructor(private readonly student: StudentService) {}

  @Get()
  state(@ExamSessionId() sessionId: string) {
    return this.student.state(sessionId);
  }

  @Post('start')
  @HttpCode(NO_CONTENT)
  start(@ExamSessionId() sessionId: string) {
    return this.student.start(sessionId);
  }

  @Put('code')
  @HttpCode(NO_CONTENT)
  saveCode(
    @ExamSessionId() sessionId: string,
    @Body({ schema: saveCodeInput }) input: SaveCodeInput,
  ) {
    return this.student.saveCode(sessionId, input);
  }

  @Post('events')
  events(
    @ExamSessionId() sessionId: string,
    @Body({ schema: eventsInput }) input: { events: ExamEventInput[] },
  ) {
    return this.student.events(sessionId, input.events);
  }

  @Post('submit')
  submit(
    @ExamSessionId() sessionId: string,
    @Body({ schema: saveCodeInput }) input: SaveCodeInput,
  ) {
    return this.student.submit(sessionId, input);
  }

  @Post('finish')
  @HttpCode(NO_CONTENT)
  finish(@ExamSessionId() sessionId: string) {
    return this.student.finish(sessionId);
  }
}
