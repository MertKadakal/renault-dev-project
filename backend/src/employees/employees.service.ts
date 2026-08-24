import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  // Cache durum değişkenleri
  private employeeCache: any[] | null = null;
  private cacheTimestamp = 0;
  private fetchPromise: Promise<any[]> | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 dakika

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getEmployees(): Promise<any[]> {
    // 1. Cache geçerliyse doğrudan bellekten dön
    if (
      this.employeeCache &&
      Date.now() - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.employeeCache;
    }

    // 2. Halihazırda devam eden bir istek varsa yeni istek atma, devam edeni bekle
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // 3. İsteği başlat ve promise kilidini ata
    this.fetchPromise = this.fetchAndProcessEmployees();

    try {
      return await this.fetchPromise;
    } finally {
      this.fetchPromise = null; // İstek bittiğinde kilidi kaldır
    }
  }

  private async fetchAndProcessEmployees(): Promise<any[]> {
    const url = this.configService.get<string>('EMPLOYEES_API_URL');
    if (!url) {
      throw new Error(
        'API url for emploeyees is not defined in the environment variables.',
      );
    }

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get<any>(url),
      );
      const data = response.data;

      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.employees)) {
        list = data.employees;
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data && Array.isArray(data.items)) {
        list = data.items;
      } else if (data && typeof data === 'object') {
        list = Object.values(data).filter((v) => v && typeof v === 'object');
      }

      // Normalizasyon işlemi
      const normalizedList = list.map((emp: any) => {
        const name = emp.Name ?? emp.name ?? emp.FIRST_NAME ?? '';
        const surname = emp.Surname ?? emp.surname ?? emp.LAST_NAME ?? '';
        return { ...emp, Name: name, Surname: surname };
      });

      // Cache'i güncelle
      this.employeeCache = normalizedList;
      this.cacheTimestamp = Date.now();

      return normalizedList;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.error('Çalışan verileri çekilirken hata oluştu:', message);
      throw error;
    }
  }
}
