import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CreateEventInput, UpdateEventInput, EventFilterInput } from './dto';
import { Event } from './entities/event.entity';
import { Location } from 'src/location/entities/location.entity';
import { LocationService } from 'src/location/location.service';
import { UsersService } from 'src/users/users.service';
import { EventGateway } from './event.gateway';
import { EVENT_TYPE } from './constants/constants';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private usersService: UsersService,
    private locationService: LocationService,
    private eventGateway: EventGateway,
  ) {}

  private async handleLocation(
    createOrUpdateEventInput: CreateEventInput | UpdateEventInput,
  ): Promise<Location> {
    if (createOrUpdateEventInput.newLocationName) {
      return await this.locationService.create({
        name: createOrUpdateEventInput.newLocationName,
      });
    } else if (createOrUpdateEventInput.locationId) {
      const location = await this.locationService.findOne(
        createOrUpdateEventInput.locationId,
      );
      if (!location) {
        throw new NotFoundException('Location not found');
      }
      return location;
    } else {
      return null;
    }
  }

  async findEvents(filter: EventFilterInput): Promise<Event[]> {
    // Start creating a query
    const query = this.eventRepository.createQueryBuilder('event');

    // Add conditions based on the filter
    if (filter.startDate) {
      query.andWhere('event.startDate >= :startDate', {
        startDate: filter.startDate,
      });
    }

    if (filter.endDate) {
      query.andWhere('event.endDate <= :endDate', { endDate: filter.endDate });
    }

    if (filter.locationId) {
      query.innerJoinAndSelect(
        'event.location',
        'eventLocation',
        'eventLocation.id = :locationId',
        { locationId: filter.locationId },
      );
    } else {
      query.leftJoinAndSelect('event.location', 'eventLocation');
    }

    query.leftJoinAndSelect('event.createdBy', 'createdBy');

    return query.getMany();
  }

  async create(
    createEventInput: CreateEventInput,
    userId: string,
  ): Promise<Event> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentTime = new Date();

    if (
      createEventInput.startDate < currentTime ||
      createEventInput.endDate < currentTime
    ) {
      throw new BadRequestException('Dates can not be in the past');
    }

    if (createEventInput.startDate > createEventInput.endDate) {
      throw new BadRequestException(
        'Start date can not be later than End date',
      );
    }

    const location = await this.handleLocation(createEventInput);

    const event = this.eventRepository.create({
      ...createEventInput,
      createdBy: user,
      location,
    });
    await this.eventRepository.save(event);

    this.eventGateway.emitEvent(EVENT_TYPE.CREATED, event);

    return event;
  }

  async update(
    userId: string,
    id: string,
    updateEventInput: UpdateEventInput,
  ): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: id },
      relations: ['createdBy'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.createdBy.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this event',
      );
    }

    const currentTime = new Date();

    if (
      updateEventInput.startDate &&
      updateEventInput.startDate < currentTime
    ) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (updateEventInput.endDate && updateEventInput.endDate < currentTime) {
      throw new BadRequestException('End date cannot be in the past');
    }

    if (
      updateEventInput.startDate &&
      updateEventInput.endDate &&
      updateEventInput.startDate > updateEventInput.endDate
    ) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    if (
      updateEventInput.startDate &&
      !updateEventInput.endDate &&
      updateEventInput.startDate > event.endDate
    ) {
      throw new BadRequestException(
        'Start date cannot be later than the current end date',
      );
    }

    if (
      !updateEventInput.startDate &&
      updateEventInput.endDate &&
      updateEventInput.endDate < event.startDate
    ) {
      throw new BadRequestException(
        'End date cannot be earlier than the current start date',
      );
    }

    if (event.startDate < currentTime && updateEventInput.startDate) {
      throw new BadRequestException(
        'Cannot change start date of event that has already started',
      );
    }

    if (event.endDate < currentTime && updateEventInput.endDate) {
      throw new BadRequestException(
        'Cannot change end date of event that has already ended',
      );
    }

    const location = await this.handleLocation(updateEventInput);
    if (location) event.location = location;

    for (const key of Object.keys(updateEventInput)) {
      if (key !== 'locationId' && key !== 'newLocationName') {
        event[key] = updateEventInput[key];
      }
    }

    await this.eventRepository.save(event);

    this.eventGateway.emitEvent(EVENT_TYPE.UPDATED, event);

    return event;
  }

  async deleteExpiredEvents(): Promise<void> {
    const expiredEvents = await this.eventRepository.find({
      where: { endDate: LessThan(new Date()) },
    });

    for (const event of expiredEvents) {
      await this.remove(event.id);
      this.eventGateway.emitEvent(EVENT_TYPE.DELETED, event);
    }
  }

  private async remove(id: string): Promise<void> {
    await this.eventRepository.delete(id);
  }
}
