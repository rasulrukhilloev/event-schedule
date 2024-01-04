import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventResolver } from './event.resolver';
import { Event } from './entities/event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModule } from 'src/location/location.module';
import { UsersModule } from 'src/users/users.module';
import { EVENT_QUEUE, EventSchedulerService } from './event-scheduler.service';
import { EventProcessor } from './event.processor';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { EventGateway } from './event.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    LocationModule,
    UsersModule,
    BullModule.registerQueueAsync({
      name: EVENT_QUEUE,
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    EventResolver,
    EventService,
    EventSchedulerService,
    EventProcessor,
    EventGateway,
  ],
})
export class EventModule {}
