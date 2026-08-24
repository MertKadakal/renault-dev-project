import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

// [DEĞİŞİKLİK] API'den dönen verinin arayüzü eklendi
export interface RawEmployee {
  Ipn: string;
  Identifier: string;
  Name: string;
  Surname: string;
  Email: string;
  DirectionCode: string;
  DepartmentCode: string;
  SuperiorIdentifier: string | null;
  SuperiorIpn: string | null;
  SuperiorName: string | null;
  SuperiorSurname: string | null;
  PhoneNumber1: string | null;
  PhoneNumber2: string | null;
  EmployeeType: string;
  Gender: string;
  StartDate: string;
  BirthDate: string;
  Quit: boolean;
  QuitDate: string | null;
  DepartmentName: string;
  DirectionName: string;
  PositionCode: string;
  SuperiorPositionCode: string | null;
  TitleCode: string | null;
  SuperiorTitleCode: string | null;
  /*Mids: unknown | null;*/
  Category: string | null;
  CostCenter: string;
  Workplace: string;
  HighSchool: string | null;
  University: string | null;
  TfiScore: string | null;
  ToeicScore: string | null;
  ShiftCode: string | null;
  MissionCode: string | null;
  CitizenshipNumber: string;
  Level: string | null;
  Scategory: string | null;
  CompanyCode: string;
  UniqueId: string;
  /*ValidCertificates: unknown | null;*/
  Nationality: string;
  HighschoolField: string | null;
  HighschoolGraduation: string | null;
  SuperiorDepartmentName: string | null;
  [key: string]: unknown;
}

// [DEĞİŞİKLİK] Normalizasyon sonrası dönülecek tip eklendi
export interface NormalizedEmployee extends RawEmployee {
  Name: string;
  Surname: string;
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  // [DEĞİŞİKLİK] any[] yerine NormalizedEmployee[] tipleri atandı
  private employeeCache: NormalizedEmployee[] | null = null;
  private cacheTimestamp = 0;
  private fetchPromise: Promise<NormalizedEmployee[]> | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 dakika

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // [DEĞİŞİKLİK] Promise<any[]> yerine Promise<NormalizedEmployee[]> yapıldı
  async getEmployees(): Promise<NormalizedEmployee[]> {
    if (
      this.employeeCache &&
      Date.now() - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.employeeCache;
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.fetchAndProcessEmployees();

    try {
      return await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  // [DEĞİŞİKLİK] Promise<any[]> yerine Promise<NormalizedEmployee[]> yapıldı
  private async fetchAndProcessEmployees(): Promise<NormalizedEmployee[]> {
    const url = this.configService.get<string>('EMPLOYEES_API_URL');
    if (!url) {
      throw new Error(
        'API url for emploeyees is not defined in the environment variables.',
      );
    }

    try {
      // [DEĞİŞİKLİK] any yerine unknown tipi kullanıldı
      const response: AxiosResponse<unknown> = await firstValueFrom(
        this.httpService.get<unknown>(url),
      );
      const data = response.data;

      // [DEĞİŞİKLİK] any[] yerine RawEmployee[] tipi atandı
      let list: RawEmployee[] = [];

      // [DEĞİŞİKLİK] any tipinden kaçınmak için nesne/dizi tür dönüşümleri eklendi
      if (Array.isArray(data)) {
        list = data as RawEmployee[];
      } else if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.employees)) {
          list = record.employees as RawEmployee[];
        } else if (Array.isArray(record.data)) {
          list = record.data as RawEmployee[];
        } else if (Array.isArray(record.items)) {
          list = record.items as RawEmployee[];
        } else {
          list = Object.values(record).filter(
            (v): v is RawEmployee => typeof v === 'object' && v !== null,
          );
        }
      }

      // [DEĞİŞİKLİK] emp: any kaldırıldı, NormalizedEmployee[] tipi ve string dönüşümleri eklendi
      const normalizedList: NormalizedEmployee[] = list.map((emp) => {
        const name = String(emp.Name ?? emp.name ?? emp.FIRST_NAME ?? '');
        const surname = String(
          emp.Surname ?? emp.surname ?? emp.LAST_NAME ?? '',
        );
        return { ...emp, Name: name, Surname: surname };
      });

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
