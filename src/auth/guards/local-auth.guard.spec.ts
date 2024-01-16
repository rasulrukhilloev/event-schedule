import { LocalAuthGuard } from './local-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn().mockImplementation(() => ({
      getContext: () => ({}),
      getArgs: () => ({
        loginUserInput: { email: 'test@example.com', password: 'password' },
      }),
    })),
  },
}));

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getRequest method', () => {
    it('should modify request with loginUserInput from GraphQL context', () => {
      const mockExecutionContext = {} as ExecutionContext;
      (GqlExecutionContext.create as jest.Mock).mockImplementation(() => ({
        getContext: () => ({}),
        getArgs: () => ({
          loginUserInput: { email: 'test', password: 'password' },
        }),
      }));

      const result = guard.getRequest(mockExecutionContext);

      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(result.body).toEqual({ email: 'test', password: 'password' });
    });
  });
});
