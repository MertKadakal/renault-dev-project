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