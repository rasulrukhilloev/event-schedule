import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './entity/users.entity';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let mockUsersService;

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const createUserInput = {
        email: 'usertest@gmail.com',
        name: 'user1',
        password: 'user1pass',
      };
      const result = new User();

      mockUsersService.create.mockResolvedValue(result);

      expect(await resolver.createUser(createUserInput)).toBe(result);
    });
    it('should handle exceptions', async () => {
      const createUserInput = {
        email: 'usertest@gmail.com',
        name: 'user1',
        password: 'user1pass',
      };

      mockUsersService.create.mockRejectedValue(
        new Error('Error creating user'),
      );

      await expect(resolver.createUser(createUserInput)).rejects.toThrow(
        'Error creating user',
      );
    });
  });

  describe('findAllUsers', () => {
    it('should return an array of users', async () => {
      const result = [new User(), new User()];

      mockUsersService.findAll.mockResolvedValue(result);

      expect(await resolver.findAllUsers()).toBe(result);
    });
  });
});
