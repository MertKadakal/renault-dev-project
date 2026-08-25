import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with secret from ConfigService', () => {
    configService.get.mockReturnValue('test-secret');
    strategy = new JwtStrategy(configService);

    expect(strategy).toBeDefined();
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('should fallback to default secret if JWT_SECRET is not configured', () => {
    configService.get.mockReturnValue(undefined);
    strategy = new JwtStrategy(configService);

    expect(strategy).toBeDefined();
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  describe('validate', () => {
    it('should validate and return mapped user payload', () => {
      configService.get.mockReturnValue('test-secret');
      strategy = new JwtStrategy(configService);

      const payload = {
        sub: 'usr-123',
        username: 'testuser',
        role: 'admin',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'usr-123',
        username: 'testuser',
        role: 'admin',
      });
    });
  });
});