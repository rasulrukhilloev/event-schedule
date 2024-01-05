import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EventService } from './event.service';
import { CHECK_EXPIRED_EVENTS_JOB, EVENT_QUEUE } from './constants/constants';

@Processor(EVENT_QUEUE)
export class EventProcessor {
  constructor(private eventService: EventService) {}

  @Process(CHECK_EXPIRED_EVENTS_JOB)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleExpiredEvents(job: Job) {
    await this.eventService.deleteExpiredEvents();
  }
}
