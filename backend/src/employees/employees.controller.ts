import { Controller, Get, UseGuards } from '@nestjs/common';
// [DEĞİŞİKLİK] Servisten dönen açık tip (NormalizedEmployee) import edildi
import { EmployeesService, NormalizedEmployee } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  // [DEĞİŞİKLİK] 'no-unsafe-return' hatasını önlemek için açık dönüş tipi (Promise<NormalizedEmployee[]>) eklendi
  async getEmployees(): Promise<NormalizedEmployee[]> {
    return await this.employeesService.getEmployees();
  }
}
