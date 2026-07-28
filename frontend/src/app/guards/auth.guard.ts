// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (token) {
    return true; // Token varsa dashboard'a erişebilir
  }

  // Token yoksa doğrudan login'e atar
  router.navigate(['/login']);
  return false;
};