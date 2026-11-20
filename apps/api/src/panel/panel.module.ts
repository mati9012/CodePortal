import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { DashboardService } from './dashboard/dashboard.service.js';
import { ExamFactsService } from './exams/exam-facts.service.js';
import { ExamsController } from './exams/exams.controller.js';
import { ExamsService } from './exams/exams.service.js';
import { LiveService } from './exams/live.service.js';
import { ResultsService } from './exams/results.service.js';
import { GroupsController } from './groups/groups.controller.js';
import { GroupsService } from './groups/groups.service.js';
import { OrganizerGuard } from './organizer.guard.js';
import { ProblemsController } from './problems/problems.controller.js';
import { ProblemsService } from './problems/problems.service.js';

@Module({
  controllers: [
    DashboardController,
    ExamsController,
    GroupsController,
    ProblemsController,
  ],
  providers: [
    OrganizerGuard,
    ExamFactsService,
    ExamsService,
    LiveService,
    ResultsService,
    GroupsService,
    ProblemsService,
    DashboardService,
  ],
  exports: [ExamFactsService],
})
export class PanelModule {}
