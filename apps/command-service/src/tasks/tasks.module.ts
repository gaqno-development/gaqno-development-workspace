import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { CreateAiTaskHandler } from './create-ai-task.handler';

@Module({
  controllers: [TasksController],
  providers: [CreateAiTaskHandler],
})
export class TasksModule {}
