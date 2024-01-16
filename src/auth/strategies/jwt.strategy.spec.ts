import { JwtStrategy } from './jwt.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entity/users.entity';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return a user for a valid payload', async () => {
      const user = {
        id: '1',
        name: 'testuser',
        email: 'test@examlpe.com',
      } as User;
      const payload = { sub: '1' };

      jest.spyOn(usersService, 'findById').mockResolvedValue(user);

      const result = await jwtStrategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      const payload = { sub: 'nonexistent' };

      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      const result = await jwtStrategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toBeNull();
    });
  });
});
