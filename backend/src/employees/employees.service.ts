import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly httpService: HttpService) {}

  async getEmployees(): Promise<any> {
    const url = 'http://oyaapp01.oyak.bur.renault.tr/humanist/api/employees?departmentCode=24200000&quit=false';
    try {
      const response: AxiosResponse<any> = await firstValueFrom(this.httpService.get<any>(url));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.error('Çalışan verileri çekilirken hata oluştu:', message);
      throw error;
    }
  }
}