import { Module } from '@nestjs/common';
import { PanelModule } from '../panel/panel.module.js';
import { ExamSessionGuard } from './exam-session.guard.js';
import {
  ExamEntryController,
  ExamSessionController,
} from './student.controller.js';
import { StudentService } from './student.service.js';

@Module({
  imports: [PanelModule],
  controllers: [ExamEntryController, ExamSessionController],
  providers: [ExamSessionGuard, StudentService],
})
export class StudentModule {}
