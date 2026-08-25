import { UnauthorizedException } from '@nestjs/common';
import { Client } from 'ldapts';
import { LdapService, resolveLdapConfig } from './ldap.service';

jest.mock('ldapts', () => ({
  Client: jest.fn(),
}));

describe('LdapService', () => {
  let service: LdapService;
  let bindMock: jest.Mock;
  let unbindMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LdapService();

    bindMock = jest.fn();
    unbindMock = jest.fn().mockResolvedValue(undefined);

    (Client as unknown as jest.Mock).mockImplementation(() => ({
      bind: bindMock,
      unbind: unbindMock,
    }));
  });

  describe('resolveLdapConfig', () => {
    it('should return default configuration when env is empty', () => {
      const config = resolveLdapConfig({});
      expect(config).toEqual({
        url: 'ldap://10.237.139.93:389',
        domain: 'CORP',
      });
    });

    it('should return custom configuration when env variables are provided', () => {
      const config = resolveLdapConfig({
        LDAP_URL: 'ldap://custom-host:389',
        LDAP_DOMAIN: 'CUSTOM_DOMAIN',
      } as NodeJS.ProcessEnv);

      expect(config).toEqual({
        url: 'ldap://custom-host:389',
        domain: 'CUSTOM_DOMAIN',
      });
    });
  });

  describe('validateUser - Validations', () => {
    it('should throw UnauthorizedException when username is empty', async () => {
      await expect(service.validateUser('', 'password')).rejects.toThrow(
        new UnauthorizedException('Kullanıcı adı ve şifre zorunludur'),
      );
    });

    it('should throw UnauthorizedException when password is empty or whitespace', async () => {
      await expect(service.validateUser('at01093', '   ')).rejects.toThrow(
        new UnauthorizedException('Kullanıcı adı ve şifre zorunludur'),
      );
    });
  });

  describe('validateUser - Static Users', () => {
    it('should successfully authenticate static admin user', async () => {
      const result = await service.validateUser('admin', 'admin123');

      expect(result).toEqual({
        username: 'admin',
        cn: 'Statik Admin',
        dn: 'CN=admin,OU=StaticUsers,DC=local',
        role: 'admin',
      });
      expect(Client).not.toHaveBeenCalled();
    });

    it('should successfully authenticate static normal user', async () => {
      const result = await service.validateUser('user', 'user123');

      expect(result).toEqual({
        username: 'user',
        cn: 'Statik Kullanıcı',
        dn: 'CN=user,OU=StaticUsers,DC=local',
        role: 'user',
      });
    });

    it('should throw UnauthorizedException for static user with wrong password', async () => {
      await expect(service.validateUser('admin', 'wrongpass')).rejects.toThrow(
        new UnauthorizedException('Kullanıcı adı veya şifre hatalı'),
      );
    });
  });

  describe('validateUser - LDAP Authentication', () => {
    it('should authenticate at01093 as admin role', async () => {
      bindMock.mockResolvedValue(undefined);

      const result = await service.validateUser('at01093', 'validpass');

      expect(bindMock).toHaveBeenCalledWith('CORP\\at01093', 'validpass');
      expect(unbindMock).toHaveBeenCalled();
      expect(result).toMatchObject({
        username: 'at01093',
        role: 'admin',
      });
    });

    it('should authenticate at03178 as admin role', async () => {
      bindMock.mockResolvedValue(undefined);

      const result = await service.validateUser('at03178', 'validpass');

      expect(result).toMatchObject({
        username: 'at03178',
        role: 'admin',
      });
    });

    it('should authenticate other LDAP users with default user role', async () => {
      bindMock.mockResolvedValue(undefined);

      const result = await service.validateUser('at99999', 'validpass');

      expect(result).toMatchObject({
        username: 'at99999',
        role: 'user',
      });
    });
  });

  describe('validateUser - LDAP Error Handling', () => {
    it('should handle Error instance with Invalid credentials message', async () => {
      bindMock.mockRejectedValue(new Error('Invalid credentials'));

      await expect(service.validateUser('at01093', 'wrongpass')).rejects.toThrow(
        new UnauthorizedException('Kullanıcı adı veya şifre hatalı'),
      );
      expect(unbindMock).toHaveBeenCalled();
    });

    it('should handle string error containing data 52e', async () => {
      bindMock.mockRejectedValue('LDAP error: data 52e occurred');

      await expect(service.validateUser('at01093', 'wrongpass')).rejects.toThrow(
        new UnauthorizedException('Kullanıcı adı veya şifre hatalı'),
      );
    });

    it('should handle object error containing 80090308 in message property', async () => {
      bindMock.mockRejectedValue({ message: 'AcceptSecurityContext error, data 80090308' });

      await expect(service.validateUser('at01093', 'wrongpass')).rejects.toThrow(
        new UnauthorizedException('Kullanıcı adı veya şifre hatalı'),
      );
    });

    it('should handle generic / connection errors', async () => {
      bindMock.mockRejectedValue(new Error('ETIMEDOUT: Connection timed out'));

      await expect(service.validateUser('at01093', 'pass')).rejects.toThrow(
        new UnauthorizedException('Giriş yapılırken bir hata oluştu'),
      );
    });

    it('should handle non-object non-string unknown errors', async () => {
      bindMock.mockRejectedValue(500);

      await expect(service.validateUser('at01093', 'pass')).rejects.toThrow(
        new UnauthorizedException('Giriş yapılırken bir hata oluştu'),
      );
    });

    it('should catch and suppress unbind rejection in finally block', async () => {
      bindMock.mockResolvedValue(undefined);
      unbindMock.mockRejectedValue(new Error('Unbind error'));

      const result = await service.validateUser('at01093', 'validpass');

      expect(result).toBeDefined();
      expect(unbindMock).toHaveBeenCalled();
    });
  });
});