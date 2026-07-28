import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard.component',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  role: string | null = null;

  constructor(private router: Router, private authService: AuthService) {
    const nav = this.router.getCurrentNavigation();
    this.role = nav?.extras?.state?.['role'] ?? localStorage.getItem('role');
  }

  // Çıkış Butonuna Tıklanınca Çalışacak Metod
  onLogout() {
    this.authService.logout();
  }
}
