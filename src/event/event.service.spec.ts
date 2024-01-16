import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { Event } from './entities/event.entity';
import { UsersService } from '../users/users.service';
import { LocationService } from '../location/location.service';
import { EventGateway } from './event.gateway';
import { CreateEventInput, UpdateEventInput } from './dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EVENT_TYPE } from './constants/constants';

function addDaysToDate(date, days) {
  const futureDate = new Date(date);
  futureDate.setDate(date.getDate() + days);
  return futureDate;
}

function createMockEvent(
  id,
  startDate,
  endDate,
  name = 'Mock Event',
  description = 'Mock Description',
) {
  return {
    id,
    name,
    description,
    startDate,
    endDate,
    createdBy: { id: 'user-id', name: 'Test User' },
    location: { id: 'location-id', name: 'Test Location' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('EventService', () => {
  let service: EventService;
  let mockEventRepository;
  let mockUsersService;
  let mockLocationService;
  let mockEventGateway;

  beforeEach(async () => {
    mockEventRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };
    mockUsersService = { findById: jest.fn() };
    mockLocationService = { findByName: jest.fn(), create: jest.fn() };
    mockEventGateway = { emitEvent: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
        {
          provide: EventGateway,
          useValue: mockEventGateway,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  describe('findEvents', () => {
    it('should return events', async () => {
      const filter = {
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test Location',
      };
      const events = [new Event(), new Event()];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(events),
      };

      mockEventRepository.createQueryBuilder = jest.fn(() => mockQueryBuilder);

      const result = await service.findEvents(filter);

      expect(result).toEqual(events);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return events from a specific start date onwards', async () => {
      const startDate = new Date();
      const filter = { startDate };
      const events = [
        createMockEvent('1', startDate, addDaysToDate(startDate, 1)),
        createMockEvent('2', startDate, addDaysToDate(startDate, 2)),
      ];
      setupQueryBuilderMock(events);

      const result = await service.findEvents(filter);

      expect(result).toEqual(events);
    });

    it('should return events for a specific location', async () => {
      const location = 'Test Location';
      const filter = { location };
      const events = [
        createMockEvent('1', new Date(), new Date(), location),
        createMockEvent('2', new Date(), new Date(), 'Another Location'),
      ];
      setupQueryBuilderMock(events);

      const result = await service.findEvents(filter);

      expect(result).toEqual(
        events.filter((event) => event.location.name === location),
      );
    });

    function setupQueryBuilderMock(events) {
      mockEventRepository.createQueryBuilder = jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(events),
      }));
    }
  });

  describe('deleteExpiredEvents', () => {
    it('should delete expired events', async () => {
      const expiredEvents = [new Event(), new Event()];
      expiredEvents.forEach((event, index) => (event.id = `event-id-${index}`));
      mockEventRepository.find.mockResolvedValue(expiredEvents);
      mockEventRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteExpiredEvents();

      expiredEvents.forEach((event) => {
        expect(mockEventRepository.delete).toHaveBeenCalledWith(event.id);
        expect(mockEventGateway.emitEvent).toHaveBeenCalledWith(
          EVENT_TYPE.DELETED,
          event,
        );
      });
    });

    it('should not delete any events if no expired events are found', async () => {
      mockEventRepository.find.mockResolvedValue([]);

      await service.deleteExpiredEvents();

      expect(mockEventRepository.delete).not.toHaveBeenCalled();
      expect(mockEventGateway.emitEvent).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const user = { id: '12312', name: 'Test User', email: 'test@example.com' };
    const location = { id: '12321312', name: 'Test Location' };
    let createEventInput;

    beforeEach(() => {
      createEventInput = new CreateEventInput();
      createEventInput.name = 'Test Event';
      createEventInput.description = 'Event Description';
      createEventInput.location = 'Test Location';
      createEventInput.startDate = addDaysToDate(new Date(), 1);
      createEventInput.endDate = addDaysToDate(new Date(), 2);
    });

    it('should successfully create an event', async () => {
      mockUsersService.findById.mockResolvedValue(user);
      mockLocationService.findByName.mockResolvedValue(location);
      const expectedEvent = {
        ...createEventInput,
        createdBy: user,
        location,
      };
      mockEventRepository.create.mockReturnValue(expectedEvent);
      mockEventRepository.save.mockResolvedValue(expectedEvent);

      const result = await service.create(createEventInput, user.id);

      expect(result).toEqual(expectedEvent);
      expect(mockEventGateway.emitEvent).toHaveBeenCalledWith(
        EVENT_TYPE.CREATED,
        expectedEvent,
      );
    });

    it('should throw an error if user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(
        service.create(createEventInput, 'non-existing-user-id'),
      ).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException if startDate is in the past', async () => {
      createEventInput.startDate = new Date('2020-01-01');

      mockUsersService.findById.mockResolvedValue(user);

      await expect(service.create(createEventInput, user.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if endDate is in the past', async () => {
      createEventInput.endDate = new Date('2020-01-02');

      mockUsersService.findById.mockResolvedValue(user);

      await expect(service.create(createEventInput, user.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if startDate is later than endDate', async () => {
      createEventInput.startDate = addDaysToDate(new Date(), 2);
      createEventInput.endDate = addDaysToDate(new Date(), 1);

      mockUsersService.findById.mockResolvedValue(user);

      await expect(service.create(createEventInput, user.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    describe('update', () => {
      const userId = '123';
      const eventId = 'event-id';
      const user = { id: userId, name: 'Test User' };
      const currentDate = new Date();
      let event;
      let updateEventInput;

      beforeEach(() => {
        event = {
          id: eventId,
          createdBy: user,
          startDate: addDaysToDate(currentDate, 5),
          endDate: addDaysToDate(currentDate, 10),
        };
        mockEventRepository.findOne.mockResolvedValue(event);
        updateEventInput = new UpdateEventInput();
      });

      it('should successfully update an event', async () => {
        updateEventInput.name = 'Updated Event Name';
        const updatedEvent = { ...event, ...updateEventInput };
        mockEventRepository.save.mockResolvedValue(updatedEvent);

        const result = await service.update(userId, eventId, updateEventInput);

        expect(result).toEqual(updatedEvent);
        expect(mockEventGateway.emitEvent).toHaveBeenCalledWith(
          EVENT_TYPE.UPDATED,
          updatedEvent,
        );
      });

      it('should throw NotFoundException if event not found', async () => {
        mockEventRepository.findOne.mockResolvedValue(null);

        await expect(
          service.update(userId, 'wrong-event-id', updateEventInput),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user is not the creator', async () => {
        const anotherUser = { id: '456', name: 'Another User' };

        await expect(
          service.update(anotherUser.id, eventId, updateEventInput),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if startDate is after endDate', async () => {
        updateEventInput.startDate = addDaysToDate(currentDate, 12);
        updateEventInput.endDate = addDaysToDate(currentDate, 10);

        await expect(
          service.update(userId, eventId, updateEventInput),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException if start date is in the past', async () => {
        updateEventInput.startDate = new Date('2020-01-01');

        await expect(
          service.update(userId, eventId, updateEventInput),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException if endDate is set before the current startDate', async () => {
        updateEventInput.endDate = addDaysToDate(event.startDate, -1);

        await expect(
          service.update(userId, eventId, updateEventInput),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException if trying to change startDate of event that has already started', async () => {
        event.startDate = addDaysToDate(currentDate, -1);
        updateEventInput.startDate = addDaysToDate(currentDate, 1);

        await expect(
          service.update(userId, eventId, updateEventInput),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException if trying to change endDate an event that has already ended', async () => {
        event.endDate = addDaysToDate(currentDate, -1);
        updateEventInput.endDate = addDaysToDate(currentDate, 1);

        await expect(
          service.update(userId, eventId, updateEventInput),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
