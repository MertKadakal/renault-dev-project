// src/auth/ldap.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as ldap from 'ldapjs';

@Injectable()
export class LdapService {
  private ldapUrl = 'ldap://localhost:389';
  private adminDn = 'cn=admin,dc=sirket,dc=com';
  private adminPassword = 'adminpassword';
  private searchBase = 'ou=users,dc=sirket,dc=com';

  async validateUser(username: string, pass: string): Promise<any> {
    const normalizedUsername = username?.trim();
    const normalizedPass = pass?.trim();

    if (!normalizedUsername || !normalizedPass) {
      throw new UnauthorizedException('Kullanıcı adı ve şifre zorunludur');
    }

    return new Promise((resolve, reject) => {
      const client = ldap.createClient({ url: this.ldapUrl });

      // Client tarafındaki genel hataları yakala
      client.on('error', (err) => {
        console.error('❌ LDAP Client Bağlantı Hatası:', err.message);
      });

      // 1. Önce Admin ile bağlan
      client.bind(this.adminDn, this.adminPassword, (err) => {
        if (err) {
          console.error('❌ Admin Bind Hatası (Admin şifresi veya DN yanlış olabilir):', err.message);
          client.unbind();
          return reject(new UnauthorizedException('LDAP Admin Bağlantı Hatası'));
        }

        console.log(`🔍 LDAP Admin Bağlantısı Başarılı. Kullanıcı aranıyor: ${normalizedUsername}`);

        // 2. Kullanıcıyı 'uid' ile ara
        const opts: ldap.SearchOptions = {
          filter: `(uid=${normalizedUsername})`,
          scope: 'sub',
        };

        client.search(this.searchBase, opts, (searchErr, res) => {
          if (searchErr || !res) {
            console.error('❌ LDAP Search Başlatma Hatası:', searchErr?.message);
            client.unbind();
            return reject(new UnauthorizedException('LDAP kullanıcı araması sırasında hata oluştu'));
          }

          let userDn: string | null = null;
          let userData: any = null;

          res.on('searchEntry', (entry) => {
            // Garantili DN alma yöntemi
            userDn = entry.dn ? entry.dn.toString() : (entry as any).objectName; 
            userData = (entry as any).object;
            console.log(`✅ Kullanıcı Dizin Katmanında Bulundu. DN: ${userDn}`);
          });

          res.on('error', (err) => {
            console.error('❌ LDAP Arama Esnasında Hata:', err.message);
            client.unbind();
            return reject(new UnauthorizedException('Arama sırasında hata oluştu'));
          });

          res.on('end', (result) => {
            if (!userDn) {
              console.error(`❌ Kullanıcı Bulunamadı! Base: ${this.searchBase}, Filter: (uid=${normalizedUsername})`);
              client.unbind();
              return reject(new UnauthorizedException('Kullanıcı bulunamadı'));
            }

            console.log(`🔑 Kullanıcı Şifresi Doğrulanıyor (Bind deneniyor)...`);

            // 3. Bulunan DN ve kullanıcının girdiği şifre ile ikinci Bind (Auth) yap
            const userClient = ldap.createClient({ url: this.ldapUrl });

            userClient.on('error', (err) => {
              console.error('❌ User Client Hatası:', err.message);
            });

            userClient.bind(userDn, normalizedPass, (bindErr) => {
              client.unbind();
              userClient.unbind();

              if (bindErr) {
                console.error(`❌ Şifre Doğrulama Başarısız! Girilen Şifre Hatalı. Detay: ${bindErr.message}`);
                return reject(new UnauthorizedException('Kullanıcı adı veya şifre hatalı'));
              }

              console.log('🎉 LDAP Kimlik Doğrulama Tamamen Başarılı!');

              resolve({
                username: normalizedUsername,
                cn: userData?.cn,
                dn: userDn,
              });
            });
          });
        });
      });
    });
  }
}