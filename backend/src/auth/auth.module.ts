import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LdapService } from './ldap.service';
import { JwtStrategy } from '../common/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'super_secret_key_change_in_production',
        signOptions: {
          expiresIn: '8h', // Token geçerlilik süresi (örneğin 8 saat)
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [LdapService, JwtStrategy],
  exports: [LdapService, JwtModule, PassportModule], // İhtiyaç halinde diğer modüllerde kullanmak için
})
export class AuthModule {}
