import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly httpService: HttpService) {}

  async getEmployees(): Promise<any[]> {
    const url = 'http://oyaapp01.oyak.bur.renault.tr/humanist/api/employees?departmentCode=24200000&quit=false';
    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get<any>(url)
      );
      const data = response.data;

      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray((data as any).employees)) {
        list = (data as any).employees;
      } else if (data && Array.isArray((data as any).data)) {
        list = (data as any).data;
      } else if (data && Array.isArray((data as any).items)) {
        list = (data as any).items;
      } else if (data && typeof data === 'object') {
        list = Object.values(data).filter((v) => v && typeof v === 'object');
      }

      // Name / Surname alanlarını güvenli şekilde normalize etme
      return list.map((emp: any) => {
        const name = emp.Name ?? emp.name ?? emp.FIRST_NAME ?? '';
        const surname = emp.Surname ?? emp.surname ?? emp.LAST_NAME ?? '';
        return { ...emp, Name: name, Surname: surname };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.error('Çalışan verileri çekilirken hata oluştu:', message);
      throw error;
    }
  }
}