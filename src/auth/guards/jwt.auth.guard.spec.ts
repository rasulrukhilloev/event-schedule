import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn().mockImplementation((context) => ({
      getContext: () => context,
    })),
  },
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getRequest method', () => {
    it('should extract request from GraphQL context', () => {
      const mockExecutionContext = {} as ExecutionContext;
      const mockContext = { req: { user: 'testUser' } };
      (GqlExecutionContext.create as jest.Mock).mockImplementation(() => ({
        getContext: () => mockContext,
      }));

      const result = guard.getRequest(mockExecutionContext);

      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(result).toBe(mockContext.req);
    });
  });
});
