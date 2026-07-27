// src/app/services/auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth/login';

  constructor(private http: HttpClient) {}

  login(username: string, pass: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, pass }).pipe(
      tap(response => {
        if (response.access_token) {
          // Token'ı localStorage'a kaydet
          localStorage.setItem('token', response.access_token);
        }
      })
    );
  }
}