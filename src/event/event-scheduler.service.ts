import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CHECK_EXPIRED_EVENTS_JOB, EVENT_QUEUE } from './constants/constants';

@Injectable()
export class EventSchedulerService implements OnModuleInit {
  constructor(@InjectQueue(EVENT_QUEUE) private eventQueue: Queue) {}

  onModuleInit() {
    this.scheduleExpiredEventCheck();
  }

  private scheduleExpiredEventCheck() {
    this.eventQueue.add(
      CHECK_EXPIRED_EVENTS_JOB,
      {},
      {
        repeat: { cron: '0 * * * * *' },
      },
    );
  }
}
