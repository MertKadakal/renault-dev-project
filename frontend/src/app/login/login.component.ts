// src/app/login/login.component.ts
import { CommonModule } from '@angular/common';
import { Component, HostBinding, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';

  carImages: string[] = [
  'assets/cars/austral.jpg',
  'assets/cars/clio.jpg',
  'assets/cars/clio2.jpg',
  'assets/cars/megane-e-tech.jpeg',
  'assets/cars/r5.jpg',
  'assets/cars/r5c.jpg',
  'assets/cars/Renault-Boreal-2026.jpg',
  'assets/cars/Renault-Clio-2026.jpg',
  'assets/cars/Renault-Clio-Interior.jpg',
  'assets/cars/Renault-duster.jpg',
  'assets/cars/Renault-Megane_Sedan-2021.jpg',
  'assets/cars/scenic-etech.jpg',
  'assets/cars/striker.png',
  'assets/cars/symbioz.jpg'
];

  @HostBinding('style.--bg-image') randomBgImage: string = '';

  ngOnInit() {
    this.setRandomBackground();
  }

  setRandomBackground() {
    const randomIndex = Math.floor(Math.random() * this.carImages.length);
    this.randomBgImage = `url('${this.carImages[randomIndex]}')`;
  }

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.username, this.password).subscribe({
      next: (res: any) => {
        console.log('Giriş başarılı:', res);
        this.router.navigate(['/dashboard'], { state: { role: res.user?.role }, replaceUrl: true });
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage = err.error?.message || 'Giriş başarısız!';
      }
    });
  }
}