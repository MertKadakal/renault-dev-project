import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  
  // NestJS backend controller adresiniz (veya '/api/employees')
  private readonly apiUrl = 'http://localhost:3000/api/employees'; 

  async getEmployees(): Promise<any[]> {
    try {
      // NestJS veriyi zaten normalize edilmiş dizi olarak döndürecek
      return await firstValueFrom(this.http.get<any[]>(this.apiUrl));
    } catch (error) {
      console.error('Çalışan verileri backend üzerinden çekilirken hata oluştu:', error);
      throw error;
    }
  }
}