import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { User } from '../users/entity/users.entity';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should return login response', async () => {
      const user = new User();
      user.email = 'test@example.com';
      const loginUserInput = {
        email: 'test@example.com',
        password: 'password',
      };
      const loginResponse = { user, token: 'token' };

      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await resolver.login(loginUserInput, user);
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(loginResponse);
    });
    it('should return null if credentials are invalid', async () => {
      const loginUserInput = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };
      const user = null;

      mockAuthService.login.mockResolvedValue(null);

      const result = await resolver.login(loginUserInput, user);
      expect(result).toBeNull();
    });
  });

  describe('me', () => {
    it('should return the current user', () => {
      const user = new User();
      user.email = 'test@example.com';

      const result = resolver.me(user);
      expect(result).toBe(user);
    });
  });
});
