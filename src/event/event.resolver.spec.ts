import { Test, TestingModule } from '@nestjs/testing';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';
import { CreateEventInput, UpdateEventInput, EventFilterInput } from './dto';
import { Event } from './entities/event.entity';
import { User } from '../users/entity/users.entity';
import { Location } from '../location/entities/location.entity';

describe('EventResolver', () => {
  const createdBy: User = {
    id: 'user_id_1',
    name: 'test',
    email: 'test@example.com',
  } as User;
  const location: Location = {
    id: '123213',
    name: 'Location 1',
  } as Location;
  let resolver: EventResolver;
  let eventService: EventService;

  beforeEach(async () => {
    const mockEventService = {
      findEvents: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventResolver,
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    resolver = module.get<EventResolver>(EventResolver);
    eventService = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findEvents', () => {
    it('should return array of events', async () => {
      const filter: EventFilterInput = {
        startDate: new Date(),
        endDate: new Date(),
      };

      const events: Event[] = [
        {
          id: 'event_id_1',
          name: 'Event 1',
          description: 'Description 1',
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: createdBy,
          location: location,
        },
        {
          id: 'event_id_2',
          name: 'Event 2',
          description: 'Description 2',
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: createdBy,
          location: location,
        },
      ];

      (eventService.findEvents as jest.Mock).mockResolvedValue(events);

      const result = await resolver.findEvents(filter);

      expect(result).toEqual(events);
    });

    it('should return empty array if no events match the filter', async () => {
      const filter: EventFilterInput = {
        startDate: new Date(),
        endDate: new Date(),
      };

      (eventService.findEvents as jest.Mock).mockResolvedValue([]);

      const result = await resolver.findEvents(filter);

      expect(result).toEqual([]);
    });
  });

  describe('createEvent', () => {
    it('should create new event', async () => {
      const createEventInput: CreateEventInput = {
        name: 'Event Name',
        startDate: new Date(),
        endDate: new Date(),
      };
      const user: User = { id: 'user_id' } as User;
      const createdEvent: Event = {
        id: 'event_id',
        name: createEventInput.name,
        description: createEventInput.description,
        startDate: createEventInput.startDate,
        endDate: createEventInput.endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createdBy,
        location: location,
      };

      (eventService.create as jest.Mock).mockResolvedValue(createdEvent);

      const result = await resolver.createEvent(createEventInput, user);

      expect(result).toEqual(createdEvent);
    });

    it('should handle errors during event creation', async () => {
      const createEventInput: CreateEventInput = {
        name: 'Event Name',
        startDate: new Date(),
        endDate: new Date(),
      };

      const errorMessage = 'Failed to create event';
      (eventService.create as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      try {
        await resolver.createEvent(createEventInput, createdBy);
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      const eventId = 'event_id';
      const updateEventInput: UpdateEventInput = {
        description: 'Updated Description',
      };
      const user: User = { id: 'user_id' } as User;
      const updatedEvent: Event = {
        id: eventId,
        name: 'Event Name',
        description: updateEventInput.description,
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createdBy,
        location: location,
      };

      (eventService.update as jest.Mock).mockResolvedValue(updatedEvent);

      const result = await resolver.updateEvent(
        eventId,
        updateEventInput,
        user,
      );

      expect(result).toEqual(updatedEvent);
    });
  });
});
