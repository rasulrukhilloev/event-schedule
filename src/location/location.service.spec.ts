import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationInput, UpdateLocationInput } from './dto';

describe('LocationService', () => {
  let locationService: LocationService;
  let locationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(Location),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    locationService = module.get<LocationService>(LocationService);
    locationRepository = module.get(getRepositoryToken(Location));
  });

  it('should be defined', () => {
    expect(locationService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new location', async () => {
      const createLocationInput: CreateLocationInput = {
        name: 'Test Location',
      };

      const createdLocation: Location = {
        id: '1',
        name: 'Test Location',
        events: [],
      };

      locationRepository.create.mockReturnValue(createLocationInput);
      locationRepository.save.mockReturnValue(createdLocation);

      const result = await locationService.create(createLocationInput);

      expect(result).toEqual(createdLocation);
    });

    it('should throw an error if location already exists', async () => {
      const createLocationInput: CreateLocationInput = {
        name: 'Existing Location',
      };

      locationRepository.findOne.mockReturnValue(Promise.resolve({}));

      try {
        await locationService.create(createLocationInput);
      } catch (error) {
        expect(error.message).toBe('Location Existing Location already exists');
      }
    });
  });

  describe('update', () => {
    it('should update a location', async () => {
      const id = '1';
      const updateLocationInput: UpdateLocationInput = {
        name: 'Updated Location',
      };

      const updatedLocation: Location = {
        id: '1',
        name: 'Updated Location',
        events: [],
      };

      locationRepository.update.mockResolvedValue(undefined);
      locationRepository.findOne.mockReturnValue(updatedLocation);

      const result = await locationService.update(id, updateLocationInput);

      expect(result).toEqual(updatedLocation);
    });

    it('should return null if the location to be updated is not found', async () => {
      const id = '1';
      const updateLocationInput: UpdateLocationInput = {
        name: 'Updated Location',
      };

      locationRepository.update.mockResolvedValue(undefined);
      locationRepository.findOne.mockReturnValue(null);

      const result = await locationService.update(id, updateLocationInput);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of locations', async () => {
      const locations: Location[] = [
        {
          id: '1',
          name: 'Location 1',
          events: [],
        },
        {
          id: '2',
          name: 'Location 2',
          events: [],
        },
      ];

      locationRepository.find.mockReturnValue(locations);

      const result = await locationService.findAll();

      expect(result).toEqual(locations);
    });

    it('should return an empty array if no locations are found', async () => {
      locationRepository.find.mockReturnValue([]);

      const result = await locationService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('should return a location by name', async () => {
      const location: Location = {
        id: '1',
        name: 'Test Location',
        events: [],
      };
      const name = 'Test Location';

      locationRepository.findOne.mockReturnValue(location);

      const result = await locationService.findByName(name);

      expect(result).toEqual(location);
    });

    it('should return null if no location with the given name is found', async () => {
      const name = 'Non-existent Location';

      locationRepository.findOne.mockReturnValue(null);

      const result = await locationService.findByName(name);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete a location by ID', async () => {
      const id = '1';

      locationRepository.delete.mockResolvedValue({ affected: 1 });

      await locationService.remove(id);

      expect(locationRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw an error if the location to be deleted is not found', async () => {
      const id = '1';

      locationRepository.delete.mockResolvedValue({ affected: 0 });

      try {
        await locationService.remove(id);
      } catch (error) {
        expect(error.message).toBe('Location not found');
      }
    });
  });
});
