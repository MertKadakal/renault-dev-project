// src/app/services/auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth/login';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, pass: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, pass }).pipe(
      tap(response => {
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
        }

        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          if (response.user.role) {
            localStorage.setItem('role', response.user.role);
          }
        }
      })
    );
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getUser(): { username: string; name: string; role?: string } | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  logout() {
    // 1. Saklanan oturum ve rol verilerini temizle
    localStorage.clear();

    // 2. Kullanıcıyı login ekranına yönlendir
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}