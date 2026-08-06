import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly httpService: HttpService) {}

  async getEmployees(): Promise<any> {
    const url = 'http://oyaapp01.oyak.bur.renault.tr/humanist/api/employees?departmentCode=24200000&quit=false';
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      this.logger.error('Çalışan verileri çekilirken hata oluştu:', error.message);
      throw error;
    }
  }
}