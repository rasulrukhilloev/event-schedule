import { Test, TestingModule } from '@nestjs/testing';
import { LocationResolver } from './location.resolver';
import { LocationService } from './location.service';
import { Location } from './entities/location.entity';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

describe('LocationResolver', () => {
  let resolver: LocationResolver;

  const mockLocationService = {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationResolver,
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    resolver = module.get<LocationResolver>(LocationResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createLocation', () => {
    it('should create a location', async () => {
      const location = new Location();
      const createLocationInput = new CreateLocationInput();
      createLocationInput.name = 'Test Location';

      mockLocationService.create.mockResolvedValue(location);
      expect(await resolver.createLocation(createLocationInput)).toBe(location);
    });

    it('should handle exceptions when creating a location', async () => {
      const createLocationInput = new CreateLocationInput();
      createLocationInput.name = 'Test Location';

      mockLocationService.create.mockRejectedValue(
        new Error('Error creating location'),
      );
      await expect(
        resolver.createLocation(createLocationInput),
      ).rejects.toThrow('Error creating location');
    });
  });

  describe('updateLocation', () => {
    it('should update a location', async () => {
      const location = new Location();
      const updateLocationInput = new UpdateLocationInput();
      updateLocationInput.name = 'Updated Location';

      mockLocationService.update.mockResolvedValue(location);
      expect(await resolver.updateLocation('1', updateLocationInput)).toBe(
        location,
      );
    });

    it('should handle exceptions when updating a location', async () => {
      const updateLocationInput = new UpdateLocationInput();
      updateLocationInput.name = 'Updated Location';

      mockLocationService.update.mockRejectedValue(
        new Error('Error updating location'),
      );
      await expect(
        resolver.updateLocation('1', updateLocationInput),
      ).rejects.toThrow('Error updating location');
    });
  });

  describe('findLocations', () => {
    it('should return an array of locations', async () => {
      const locations = [new Location(), new Location()];
      mockLocationService.findAll.mockResolvedValue(locations);
      expect(await resolver.findLocations(0, 10)).toBe(locations);
    });

    it('should handle exceptions when finding locations', async () => {
      mockLocationService.findAll.mockRejectedValue(
        new Error('Error finding locations'),
      );
      await expect(resolver.findLocations(0, 10)).rejects.toThrow(
        'Error finding locations',
      );
    });
  });

  describe('deleteLocation', () => {
    it('should delete a location', async () => {
      mockLocationService.remove.mockResolvedValue(true);
      expect(await resolver.deleteLocation('1')).toBe(true);
    });

    it('should handle exceptions when deleting a location', async () => {
      mockLocationService.remove.mockRejectedValue(
        new Error('Error deleting location'),
      );
      await expect(resolver.deleteLocation('1')).rejects.toThrow(
        'Error deleting location',
      );
    });
  });
});
