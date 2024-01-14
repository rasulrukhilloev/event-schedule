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
import { CreateLocationInput } from 'src/location/dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private usersService: UsersService,
    private locationService: LocationService,
    private eventGateway: EventGateway,
  ) {}

  private async handleLocation(locationName: string): Promise<Location | null> {
    const locationObj = await this.locationService.findByName(locationName);
    if (locationObj) return locationObj;

    const createLocationInput = new CreateLocationInput();
    createLocationInput.name = locationName;
    return await this.locationService.create(createLocationInput);
  }

  async findEvents(filter: EventFilterInput): Promise<Event[]> {
    const query = this.eventRepository.createQueryBuilder('event');

    query.leftJoinAndSelect('event.location', 'location');
    query.leftJoinAndSelect('event.createdBy', 'createdBy');

    if (filter.startDate) {
      query.andWhere('event.startDate >= :startDate', {
        startDate: filter.startDate,
      });
    }

    if (filter.endDate) {
      query.andWhere('event.endDate <= :endDate', {
        endDate: filter.endDate,
      });
    }

    if (filter.location) {
      query.andWhere('location.name = :locationName', {
        locationName: filter.location,
      });
    }

    query.orderBy('event.createdAt', 'DESC');

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

    let location = null;
    if (createEventInput.location) {
      location = await this.handleLocation(createEventInput.location);
    }

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

    if (updateEventInput.location) {
      const newLocation = await this.handleLocation(updateEventInput.location);
      event.location = newLocation;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { location, ...updateData } = updateEventInput;
    Object.assign(event, updateData);

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
