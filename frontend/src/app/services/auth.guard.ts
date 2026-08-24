// src/app/services/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      return true;
    }

    // Eğer token yoksa login sayfasına yönlendir ve geçmişi değiştir
    this.router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
}
