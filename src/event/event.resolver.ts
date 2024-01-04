import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { EventService } from './event.service';
import { Event } from './entities/event.entity';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { EventFilterInput } from './dto/event-filter.input';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/users/entity/users.entity';

@Resolver(() => Event)
export class EventResolver {
  constructor(private eventService: EventService) {}

  @Query(() => [Event])
  findEvents(
    @Args('filter', { type: () => EventFilterInput }) filter: EventFilterInput,
  ): Promise<Event[]> {
    return this.eventService.findEvents(filter);
  }

  @Mutation(() => Event)
  @UseGuards(JwtAuthGuard)
  createEvent(
    @Args('createEventInput') createEventInput: CreateEventInput,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventService.create(createEventInput, user.id);
  }

  @Mutation(() => Event)
  @UseGuards(JwtAuthGuard)
  updateEvent(
    @Args('id') id: string,
    @Args('updateEventInput') updateEventInput: UpdateEventInput,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventService.update(user.id, id, updateEventInput);
  }
}
