// src/auth/auth.controller.ts
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LdapService } from './ldap.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly ldapService: LdapService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: { username: string; pass: string }) {
    try {
      const user = await this.ldapService.validateUser(body.username, body.pass);

      const payload = { username: user.username, sub: user.dn, name: user.cn, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      return {
        access_token: accessToken,
        user: {
          username: user.username,
          name: user.cn,
          role: user.role,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Giriş başarısız';
      throw new UnauthorizedException(message);
    }
  }
}