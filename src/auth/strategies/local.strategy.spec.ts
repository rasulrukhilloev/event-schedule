import { LocalStrategy } from './local.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { User } from '../../users/entity/users.entity';

describe('LocalStrategy', () => {
  let localStrategy: LocalStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    localStrategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(localStrategy).toBeDefined();
  });

  describe('validate', () => {
    const email = 'test@example.com';
    const password = 'password';

    it('should return a user when validation is successful', async () => {
      const user = {
        id: '1',
        name: 'testuser',
        email: 'test@examlpe.com',
      } as User;

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      const result = await localStrategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(user);
    });

    it('should throw an UnauthorizedException when user is not found', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(localStrategy.validate(email, password)).rejects.toThrow(
        'Unauthorized',
      );
    });
  });
});
