import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: 'admin' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('should allow access if user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'manager']);
    const context = createMockContext({ role: 'admin' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access if user does not have a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ role: 'user' });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access if request has no user object', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access if user has no role defined', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ username: 'testuser' });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});