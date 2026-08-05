import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-temp-data-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './temp-data-viewer.component.html',
  styleUrls: ['./temp-data-viewer.component.css'],
})
export class TempDataViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // Angular Signals kullanımı
  jsonData = signal<any>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.errorMessage.set('Geçersiz bağlantı.');
      this.loading.set(false);
      return;
    }

    this.fetchData(token);
  }

  private fetchData(token: string): void {
    this.http.get(`http://localhost:3000/api/temp-link/${token}`).subscribe({
      next: (response) => {
        this.jsonData.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API İsteği Hatası:', err);
        if (err.status === 410) {
          this.errorMessage.set('Bu geçici linkin süresi dolmuş.');
        } else {
          this.errorMessage.set('Veri yüklenirken bir hata oluştu veya link bulunamadı.');
        }
        this.loading.set(false);
      },
    });
  }
}