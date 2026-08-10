// src/auth/ldap.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { Client } from 'ldapts';

dotenv.config();

export interface LdapConfig {
  url: string;
  domain: string;
}

// Statik kullanıcı tanımları
const STATIC_USERS: Record<string, { pass: string; role: string; cn: string }> = {
  admin: {
    pass: 'admin123',
    role: 'admin',
    cn: 'Statik Admin',
  },
  user: {
    pass: 'user123',
    role: 'user',
    cn: 'Statik Kullanıcı',
  },
};

export function resolveLdapConfig(env: NodeJS.ProcessEnv = process.env): LdapConfig {
  return {
    url: env.LDAP_URL || 'ldap://10.237.139.93:389',
    domain: env.LDAP_DOMAIN || 'CORP',
  };
}

@Injectable()
export class LdapService {
  private getConfig(): LdapConfig {
    return resolveLdapConfig();
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const normalizedUsername = username?.trim();
    const normalizedPass = pass?.trim();

    if (!normalizedUsername || !normalizedPass) {
      throw new UnauthorizedException('Kullanıcı adı ve şifre zorunludur');
    }

    // 1. Statik Kullanıcı Kontrolü (LDAP'a gitmeden)
    const staticUser = STATIC_USERS[normalizedUsername];
    if (staticUser) {
      if (staticUser.pass === normalizedPass) {
        return {
          username: normalizedUsername,
          cn: staticUser.cn,
          dn: `CN=${normalizedUsername},OU=StaticUsers,DC=local`,
          role: staticUser.role,
        };
      }
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    // 2. LDAP Doğrulaması
    const config = this.getConfig();
    const client = new Client({ url: config.url });

    try {
      await client.bind(`${config.domain}\\${normalizedUsername}`, normalizedPass);

      const role = normalizedUsername === 'at01093' || normalizedUsername === 'at03178' ? 'admin' : 'user';

      return {
        username: normalizedUsername,
        cn: normalizedUsername,
        dn: `CN=${normalizedUsername},OU=Users,DC=${config.domain.toLowerCase()},DC=local`,
        role,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kullanıcı adı veya şifre hatalı';
      throw new UnauthorizedException(message);
    } finally {
      await client.unbind().catch(() => undefined);
    }
  }
}