import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LdapService } from './ldap.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_key_change_in_production', // Canlıda .env'den çekin
      signOptions: { 
        expiresIn: '8h', // Token geçerlilik süresi (örneğin 8 saat)
      },
    }),
  ],
  controllers: [AuthController],
  providers: [LdapService],
  exports: [LdapService, JwtModule, PassportModule], // İhtiyaç halinde diğer modüllerde kullanmak için
})
export class AuthModule {}