import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/employees'; // NestJS backend adresi

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}