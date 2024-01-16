import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return a user if credentials are valid', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
      expect(result).toEqual({ email: 'test@example.com' });
    });

    it('should return null if user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'someuser@example.com',
        'password',
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'someuser@example.com',
      );
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedpassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return a login response with a JWT token', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const expectedPayload = { sub: 1, email: 'test@example.com' };
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.login(mockUser as any);
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual({
        user: mockUser,
        token: 'jwt_token',
      });
    });

    it('should throw an error if JWT signing fails', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT Error');
      });

      await expect(service.login(mockUser as any)).rejects.toThrow(
        'user JWT Error',
      );
    });
  });
});
