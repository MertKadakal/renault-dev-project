import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface TemporaryData {
  data: any;
  expiresAt: number;
}

@Injectable()
export class TemporaryLinkService {
  // Bellekte verileri token -> veri şeklinde saklayacağız
  private storage = new Map<string, TemporaryData>();

  constructor() {
    // Manuel olarak sabit bir test token'ı ve verisi ekliyoruz
    this.storage.set('employers', {
      data: [
  {
    "id": 1,
    "ad": "Ahmet",
    "soyad": "Yılmaz",
    "kisaltma": "AY"
  },
  {
    "id": 2,
    "ad": "Ayşe",
    "soyad": "Kaya",
    "kisaltma": "AK"
  },
  {
    "id": 3,
    "ad": "Mehmet",
    "soyad": "Demir",
    "kisaltma": "MD"
  },
  {
    "id": 4,
    "ad": "Fatma",
    "soyad": "Çelik",
    "kisaltma": "FÇ"
  },
  {
    "id": 5,
    "ad": "Ali",
    "soyad": "Öztürk",
    "kisaltma": "AÖ"
  },
  {
    "id": 6,
    "ad": "Zeynep",
    "soyad": "Aydın",
    "kisaltma": "ZA"
  },
  {
    "id": 7,
    "ad": "Mustafa",
    "soyad": "Arslan",
    "kisaltma": "MA"
  },
  {
    "id": 8,
    "ad": "Elif",
    "soyad": "Şahin",
    "kisaltma": "EŞ"
  },
  {
    "id": 9,
    "ad": "Can",
    "soyad": "Yıldız",
    "kisaltma": "CY"
  },
  {
    "id": 10,
    "ad": "Deniz",
    "soyad": "Özdemir",
    "kisaltma": "DÖ"
  }
],
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 saat geçerli
    });
  }

  /**
   * Geçici link token'ı oluşturur.
   * @param payload Saklanacak JSON verisi
   * @param ttlSeconds Linkin kaç saniye geçerli olacağı (Örn: 300s = 5dk)
   */
  createTemporaryLink(payload: any, ttlSeconds: number = 300): { token: string; expiresAt: Date } {
    const token = uuidv4();
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.storage.set(token, {
      data: payload,
      expiresAt,
    });

    return { token, expiresAt: new Date(expiresAt) };
  }

  /**
   * Token ile JSON verisini getirir.
   */
  getDataByToken(token: string): any {
    const record = this.storage.get(token);

    if (!record) {
      throw new NotFoundException('Geçersiz veya bulunamayan link.');
    }

    if (Date.now() > record.expiresAt) {
      this.storage.delete(token); // Süresi geçmiş veriyi temizle
      throw new GoneException('Bu linkin kullanım süresi dolmuştur.');
    }

    return record.data;
  }
}