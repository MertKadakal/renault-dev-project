import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
<<<<<<< HEAD
<<<<<<< HEAD
import { AxiosResponse } from 'axios';
=======
>>>>>>> 6959602e84eb35b5a37ee2f6890111f62c22482e
=======
>>>>>>> 6959602e84eb35b5a37ee2f6890111f62c22482e

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly httpService: HttpService) {}

  async getEmployees(): Promise<any> {
    const url = 'http://oyaapp01.oyak.bur.renault.tr/humanist/api/employees?departmentCode=24200000&quit=false';
    try {
<<<<<<< HEAD
<<<<<<< HEAD
      const response: AxiosResponse<any> = await firstValueFrom(this.httpService.get<any>(url));
=======
      const response = await firstValueFrom(this.httpService.get(url));
>>>>>>> 6959602e84eb35b5a37ee2f6890111f62c22482e
=======
      const response = await firstValueFrom(this.httpService.get(url));
>>>>>>> 6959602e84eb35b5a37ee2f6890111f62c22482e
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.error('Çalışan verileri çekilirken hata oluştu:', message);
      throw error;
    }
  }
}