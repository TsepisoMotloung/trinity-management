import { Global, Module } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { ActionLogController } from './action-log.controller';

@Global()
@Module({
  providers: [ActionLogService],
  controllers: [ActionLogController],
  exports: [ActionLogService],
})
export class ActionLogModule {}
