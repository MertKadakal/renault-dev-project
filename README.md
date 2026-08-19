# 🚗 Renault Proje Takip Sistemi (Renault Project Tracking System)

![Renault Banner](https://img.shields.io/badge/Renault-Software%20Development%20Team-yellow?style=for-the-badge&logo=renault)
![NestJS](https://img.shields.io/badge/Backend-NestJS-red?style=for-the-badge&logo=nestjs)
![Angular](https://img.shields.io/badge/Frontend-Angular%2022-dd0031?style=for-the-badge&logo=angular)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge&logo=postgresql)
![LDAP](https://img.shields.io/badge/Auth-LDAP%20%2F%20JWT-green?style=for-the-badge)

Renault yazılım geliştirme ekibi tarafından geliştirilen ve yönetilen iç projelerin, teknik altyapı detaylarının, sorumlu personelin, canlı/test ortamlarının ve metriklerin uçtan uca takip edildiği **Proje Takip ve Yönetim Sistemi**'dir.

---

## 📑 İçindekiler

1. [İşlevsel Detaylar ve Özellikler](#-i%C5%9Flevsel-detaylar-ve-%C3%B6zellikler)
2. [Teknik Mimari ve Teknolojiler](#-teknik-mimari-ve-teknolojiler)
3. [Veritabanı Şeması (Database Schema)](#-veritaban%C4%B1-%C5%9Femas%C4%B1-database-schema)
4. [REST API End-point'leri](#-rest-api-end-pointleri)
5. [Kurulum ve Çalıştırma Rehberi](#-kurulum-ve-%C3%87al%C4%B1%C5%9Ft%C4%B1rma-rehberi)
6. [Geliştirme ve Dağıtım Metodolojisi](#-geli%C5%9Ftirme-ve-da%C4%9F%C4%B1t%C4%B1m-metodolojisi)
7. [Proje Ekibi](#-proje-ekibi)

---

## 💡 İşlevsel Detaylar ve Özellikler

Renault Proje Takip Sistemi, şirket bünyesindeki yazılım envanterini merkezi bir platformda toplamak ve proje yaşam döngüsünü kolayca izlemek amacıyla tasarlanmıştır.

### 🔑 1. Kimlik Doğrulama ve Rol Tabanlı Erişim Control (RBAC)
* **Renault Kurumsal LDAP Entegrasyonu:** Kullanıcılar Renault Active Directory / LDAP kimlik bilgileriyle sisteme giriş yapabilir.
* **Rol Dağılımı:**
  * **Admin:** Yeni proje oluşturma, mevcut projeleri güncelleme, silme ve dinamik alan ekleme yetkilerine sahiptir.
  * **User (Gözlemci):** Projeleri listeleme, arama, filtreleme ve detaylarını görüntüleme yetkisine sahiptir.
* **Geliştirme / Test Modu (Static Fallback Accounts):** LDAP sunucusuna erişilemeyen durumlarda test yapılabilmesi için statik `admin` ve `user` hesapları desteklenir.

### 📊 2. Esnek Proje Listeleme ve Görünüm Modları
* **Kart (Grid) Görünümü:** Projelerin temel bilgilerini (Canlı/Test URL, DE Sorumlu, Aktiflik Durumu, SLA, Karmaşıklık) görsel kartlar halinde sunar.
* **Tablo (Table) Görünümü:** Projeleri detaylı kolonlar halinde listeleyerek hızlı karşılaştırma ve toplu inceleme olanağı sağlar.
* **Görünüm Geçişi (Toggle View):** Kullanıcı tek bir tıklamayla Grid ve Tablo görünümleri arasında geçiş yapabilir.

### 🔍 3. Gelişmiş Arama, Filtreleme ve Sıralama
* **Çok Yönlü Arama (Search Fields):** Uygulama Adı, Sektörlük, Frontend/Backend Teknolojileri, DE Sorumlu, Canlı/Test URL vb. alanlara göre anlık arama.
* **Dinamik Sıralama (Sorting):** Projeleri isme, oluşturulma tarihine veya aktiflik durumuna göre artan/azalan (ASC/DESC) sıralama.
* **Aktif / Pasif Sayacı:** Sistemde aktif durumda olan projelerin sayısını canlı olarak hesaplar ve özet panoda gösterir.

### 🛠️ 4. Proje Detay Yönetimi ve Dinamik Alanlar (Custom Fields)
* **Teknik Altyapı Takibi:** Projenin kullandığı Frontend/Backend mimarisi, versiyonları, Veritabanı Türü (PostgreSQL, Oracle vb.) ve Platform bilgisi saklanır.
* **Canlı ve Test Bağlantıları:** Canlı (Production) ve Test ortamlarının URL adresleri doğrudan kart/tablo üzerinden erişilebilir.
* **DE Sorumlu (Departman/Ekip Sorumlusu):** Projeden sorumlu kişiler dış çalışandan (Employee API) otomatik çekilerek seçilir ve ilişkilendirilir.
* **Dinamik Özel Alanlar (JSONB Custom Fields):** Projeye özel sabit olmayan ek parametreler (ör. *Git Repo*, *Kubernetes Cluster*, *SonarQube Skoru*) key-value şeklinde eklenebilir ve esnek şekilde yönetilir.

---

## 🏗️ Teknik Mimari ve Teknolojiler

Uygulama, modern web standartlarına uygun olarak ayrıştırılmış (decoupled) **Client-Server** mimarisinde geliştirilmiştir.

```
+-------------------------------------------------------+
|                   Angular 22 Client                   |
|   (Standalone Components, RxJS, HttpClient, CSS)      |
+---------------------------+---------------------------+
                            | HTTP / JWT Header
                            v
+-------------------------------------------------------+
|                   NestJS 11 Backend                   |
|   (TypeScript, TypeORM, Passport JWT, LDAP Auth)      |
+-------------+---------------------------+-------------+
              |                           |
              v                           v
+--------------------------+  +-------------------------+
| PostgreSQL Veritabanı    |  | Renault LDAP Sunucusu   |
| (Projects Data & JSONB)  |  | & External Employee API |
+--------------------------+  +-------------------------+
```

### Backend Teknolojileri
* **Framework:** NestJS (Node.js / TypeScript)
* **ORM:** TypeORM
* **Veritabanı:** PostgreSQL (JSONB desteği ile)
* **Güvenlik & Auth:** JWT (`@nestjs/jwt`, `passport-jwt`), LDAP Client (`ldapts`)
* **HTTP İstemcisi:** `@nestjs/axios` (Harici servis entegrasyonu için)
* **Önbellekleme (Caching):** In-memory TTL cache (5 dakika) - Harici Çalışan API isteklerini optimize etmek için.

### Frontend Teknolojileri
* **Framework:** Angular 22
* **Mimarisi:** Standalone Components & Signal-friendly yapı
* **Reaktif Programlama:** RxJS & HttpClient
* **Stil:** Custom Vanilla CSS (Modern Dark/Light Temalı UI, responsive tasarım)
* **Yönlendirme & Güvenlik:** Angular Router & `AuthGuard`

---

## 🗄️ Veritabanı Şeması (Database Schema)

Sistem PostgreSQL veritabanında `public.projects` tablosunu kullanmaktadır.

| Kolon Adı | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `id` | `INTEGER` (PK, Auto Inc) | Benzersiz Proje Kimliği |
| `uygulama_adi` | `VARCHAR` | Uygulama / Proje Adı |
| `sektorluk` | `VARCHAR` | Sektör / İş Birimi |
| `tanim_uygulama_aciklama` | `TEXT` | Proje Açıklaması |
| `canli_url` | `VARCHAR` | Production URL |
| `test_url` | `VARCHAR` | Staging / Test URL |
| `aktif_pasif` | `VARCHAR(1)` | Status ('A': Aktif, 'P': Pasif) |
| `frontend` | `VARCHAR` | Kullanılan Frontend Framework |
| `fe_version` | `VARCHAR` | Frontend Versiyonu |
| `backend` | `VARCHAR` | Kullanılan Backend Framework |
| `be_version` | `VARCHAR` | Backend Versiyonu |
| `database_type` | `VARCHAR` | Veritabanı Tipi (PostgreSQL, Oracle vb.) |
| `platform` | `VARCHAR` | Platform (Web, Mobile, Cloud vb.) |
| `de_sorumlu` | `VARCHAR` | Proje Sorumlusu / Geliştiriciler |
| `sla` | `VARCHAR` | SLA Seviyesi / Şartları |
| `complexity` | `VARCHAR` | Proje Karmaşıklık Derecesi |
| `custom_fields` | `JSONB` | Dinamik Özel Key-Value Alanları |
| `created_at` | `TIMESTAMP` | Oluşturulma Tarihi |

---

## 🌐 REST API End-point'leri

### 🔐 Auth Module (`/auth`)
* `POST /auth/login`: Kullanıcı girişi (LDAP veya Statik yetkilendirme). Doğrulama sonrası JWT Token döndürür.

### 📁 Projects Module (`/projects`)
* `GET /projects`: Tüm projeleri getirir (Gereksinim: `JwtAuthGuard`).
* `GET /projects/:id`: Belirtilen ID'li projenin detayını getirir (Gereksinim: `JwtAuthGuard`).
* `POST /projects`: Yeni proje ekler (Gereksinim: `JwtAuthGuard`, `RolesGuard: Admin`).
* `PUT /projects/:id`: Proje bilgilerini günceller (Gereksinim: `JwtAuthGuard`, `RolesGuard: Admin`).
* `DELETE /projects/:id`: Projeyi siler (Gereksinim: `JwtAuthGuard`, `RolesGuard: Admin`).

### 👥 Employees Module (`/employees`)
* `GET /employees`: Harici çalışan API'sinden çalışan listesini çeker. Performance artışı için 5 dakikalık bellek içi önbellek (In-memory Cache) kullanır.

---

## 🚀 Kurulum ve Çalıştırma Rehberi

### 📋 Ön Gereksinimler
* [Node.js](https://nodejs.org/) (v18.x veya v20.x önerilir)
* [npm](https://www.npmjs.com/) (v9.x veya üzeri)
* [PostgreSQL](https://www.postgresql.org/) (v13+ veya üzeri)

---

### 1️⃣ Backend Kurulumu ve Çalıştırılması

1. Backend dizinine geçin:
   ```bash
   cd backend
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyasını oluşturun veya düzenleyin:
4. Backend servisini geliştirme modunda başlatın:
   ```bash
   npm run start:dev
   ```
---

### 2️⃣ Frontend Kurulumu ve Çalıştırılması

1. Frontend dizinine geçin:
   ```bash
   cd frontend
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Uygulamayı geliştirme sunucusunda başlatın:
   ```bash
   npm start
   ```
---

## 📦 Proje Dizin Yapısı

```
renault-dev-project/
├── backend/
│   ├── src/
│   │   ├── auth/            # LDAP ve JWT Kimlik Doğrulama Servisleri
│   │   ├── common/          # Guard'lar, Decorator'lar ve Interceptor'lar
│   │   ├── employees/       # Çalışan Verisi ve Cache Servisleri
│   │   ├── projects/        # Proje CRUD Mantığı ve Entity Tanımları
│   │   │   └── entities/    # TypeORM Project Entity
│   │   ├── app.module.ts    # Ana NestJS Modülü
│   │   └── main.ts          # Uygulama Başlangıç Noktası
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/   # Proje Kartları, Tablo ve Modal Bileşenleri
│   │   │   ├── login/       # Giriş Ekranı Bileşeni
│   │   │   ├── interceptors/# HTTP JWT Token Interceptor
│   │   │   ├── models/      # TypeScript Veri Modelleri (Project, User vb.)
│   │   │   ├── services/    # AuthGuard, AuthService, ProjectService
│   │   │   ├── app.routes.ts# Sayfa Yönlendirme Tanımları
│   │   │   └── app.config.ts# Angular Uygulama Konfigürasyonu
│   │   ├── styles.css       # Genel Stil Dosyaları
│   │   └── index.html
│   ├── package.json
│   └── angular.json
│
└── README.md                # Proje Dokümantasyonu
```

---

## 👥 Proje Ekibi

* **Mert Kadakal**
* **Selin Sinem Ergül**

*Renault Software Development Team*
