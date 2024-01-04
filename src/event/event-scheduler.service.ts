import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventService } from './event.service';

export const EVENT_QUEUE = 'event-queue';
export const CHECK_EXPIRED_EVENTS_JOB = 'check-expired-events';

@Injectable()
export class EventSchedulerService implements OnModuleInit {
  constructor(
    @InjectQueue(EVENT_QUEUE) private eventQueue: Queue,
    private eventService: EventService,
  ) {}

  onModuleInit() {
    this.scheduleExpiredEventCheck();
  }

  private scheduleExpiredEventCheck() {
    this.eventQueue.add(
      CHECK_EXPIRED_EVENTS_JOB,
      {},
      {
        repeat: { cron: '*/30 * * * * *' },
      },
    );
  }
}
