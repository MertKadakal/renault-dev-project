import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { TempDataViewerComponent } from './temp-data-viewer/temp-data-viewer.component';

export const routes: Routes = [
  // Kullanıcı /login adresine giderse LoginComponent çalışır
  { path: 'login', component: LoginComponent },
  
  // Kullanıcı /dashboard adresine giderse DashboardComponent çalışır
  { path: 'dashboard', component: DashboardComponent },
  
  // Uygulama ilk açıldığında boş path gelirse login'e yönlendir
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  { path: 'view-temp-data/:token', component: TempDataViewerComponent }
];