# Renault Proje Yönetim Uygulaması

Renault yazılım geliştirme ekibi için hazırlanan bu proje; NestJS (TypeScript) backend ve Angular frontend mimarisine sahip, Postgres veritabanı destekli bir Proje Yönetim (CRUD) web uygulamasıdır.

---

## Çalıştırma Adımları

### 1. Yerel Ortamda Çalıştırma

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
ng serve --open
```

---

## Veritabanı Bilgileri (PostgreSQL)

Uygulamanın çalışabilmesi için bir **PostgreSQL** sunucusu gereklidir. Bağlantı ayarları şu şekildedir:

* **Host:** localhost
* **Port:** 5432
* **Username:** postgres
* **Password:** mert
* **Database:** postgres
* **ORM Ayarları:** `autoLoadEntities: true`, `synchronize: false`
