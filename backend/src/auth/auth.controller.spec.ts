import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LdapService } from './ldap.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let ldapService: jest.Mocked<LdapService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockLdapService = {
      validateUser: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LdapService, useValue: mockLdapService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    ldapService = module.get(LdapService);
    jwtService = module.get(JwtService);

    // Test log kirliliğini önlemek için console.error mock'lanır
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      pass: 'password123',
    };

    it('should return access token and user info on successful authentication', async () => {
      const mockUser = {
        username: 'testuser',
        dn: 'cn=testuser,dc=example,dc=com',
        cn: 'Test User',
        role: 'admin',
      };
      const mockToken = 'mock-jwt-token';

      ldapService.validateUser.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await controller.login(loginDto);

      expect(ldapService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.dn,
        name: mockUser.cn,
        role: mockUser.role,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          username: mockUser.username,
          name: mockUser.cn,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException when user is not found or credentials invalid', async () => {
      ldapService.validateUser.mockResolvedValue(null as any);

      await expect(controller.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Kullanıcı adı veya şifre hatalı.'),
      );
    });

    it('should throw UnauthorizedException with original message when an Error is thrown', async () => {
      ldapService.validateUser.mockRejectedValue(new Error('LDAP connection timeout'));

      await expect(controller.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('LDAP connection timeout'),
      );
    });

    it('should throw UnauthorizedException with fallback message for non-Error thrown objects', async () => {
      ldapService.validateUser.mockRejectedValue('Unknown string error');

      await expect(controller.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Giriş başarısız'),
      );
    });
  });
});