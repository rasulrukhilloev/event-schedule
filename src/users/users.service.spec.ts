import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/users.entity';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new user', async () => {
      const createUserInput = {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'sometestUser',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createUserInput);
      mockRepository.save.mockImplementation((user) =>
        Promise.resolve({ id: '123', ...user }),
      );

      const result = await service.create(createUserInput);

      expect(result).toEqual({ id: '123', ...createUserInput });
      expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
    });

    it('should throw exception if user exists', async () => {
      const createUserInput = {
        email: 'existing@example.com',
        password: 'password',
        name: 'sometestUser',
      };

      mockRepository.findOne.mockResolvedValue(createUserInput);

      await expect(service.create(createUserInput)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const user = new User();
      user.id = '123';
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('123');

      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('12343');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const user = new User();
      user.email = 'test@example.com';
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('noUser@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [new User(), new User()];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
    });
  });
});
