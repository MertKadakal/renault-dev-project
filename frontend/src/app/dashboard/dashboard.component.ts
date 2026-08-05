import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../models/project';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';

interface ProjectFormState {
  uygulamaAdi?: string;
  sektorluk?: string;
  tanimUygulamaAciklama?: string | null;
  canliUrl?: string;
  testUrl?: string;
  aktifPasif?: string;
  frontend?: string;
  feVersion?: string | null;
  backend?: string;
  beVersion?: string | null;
  databaseType?: string;
  platform?: string;
  deSorumlu?: string;
  stSorumlu?: string | null;
  complexity?: string;
  customFields: Array<{ key: string; value: string }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm = '';
  isLoading = true;
  hasError = false;
  role: string | null = null;
  showEditor = false;
  editingProject: Project | null = null;
  formState: ProjectFormState = this.createEmptyFormState();
  isSaving = false;
  searchField: string = 'all';
  currentUser: { username: string; name: string; role?: string } | null = null;
  employerOptions: string[] = [];
  readonly textLimit: number = 30;
  viewMode: 'grid' | 'table' = 'grid';
  
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchProjects();
      this.fetchEmployerTempData();
    }

    this.currentUser = this.authService.getUser();
  }
  
  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.role = this.authService.getRole() ?? this.router.getCurrentNavigation()?.extras?.state?.['role'] ?? null;
  }

  generateAndLogTempLink(projectData?: any): void {
    // Gönderilecek JSON verisini belirliyoruz (parametre verilmezse mevcut projeleri yolla)
    const payloadToShare = projectData || this.projects;

    const body = {
      payload: payloadToShare,
      ttlSeconds: 600 // 10 dakika geçerli
    };

    this.http.post('http://localhost:3000/api/temp-link/generate', body).subscribe({
      next: (response: any) => {
        console.log('--- GEÇİCİ LİNK OLUŞTURULDU ---');
        console.log('Gelen Token:', response.token);
        console.log('Son Kullanma Tarihi:', response.expiresAt);
        console.log('Paylaşılabilir Link:', response.shareableUrl);
        console.log('---------------------------------');
      },
      error: (err) => {
  console.error('Geçici link oluşturulurken hata oluştu:', err);
  console.log('Hata Kodu (Status):', err.status);
  console.log('Hata Detayı:', err.error);
}
    });
  }

  // Görünüm modunu değiştiren fonksiyon
  setViewMode(mode: 'grid' | 'table'): void {
    this.viewMode = mode;
  }

  // Pop-up durumunu tutan değişken
  isProfileOpen: boolean = false;

  // Pop-up'ı açma
  openProfile(): void {
    this.isProfileOpen = true;
  }

  // Pop-up'ı kapatma
  closeProfile(): void {
    this.isProfileOpen = false;
  }

  

  fetchProjects(): void {
    this.isLoading = true;
    this.hasError = false;

    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects = Array.isArray(data) ? data : [];
        this.filteredProjects = [...this.projects];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.hasError = true;
        console.error('Projeler çekilirken hata oluştu!', error);
      }
    });
  }

  fetchEmployerTempData(): void {
    this.http.get<Array<{ id: number; ad: string; soyad: string; kisaltma: string }>>('http://localhost:3000/api/temp-link/employers').subscribe({
      next: (data) => {
        console.log('--- EMPLOYERS VERİSİ ---');
        console.log(data);
        console.log('-------------------------');
        this.employerOptions = data.map((item) => item.ad + ' ' + item.soyad);
      },
      error: (error) => {
        console.error('Employers verisi alınırken hata oluştu:', error);
      }
    });
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  createEmptyFormState(): ProjectFormState {
    return {
      uygulamaAdi: '',
      sektorluk: '',
      tanimUygulamaAciklama: '',
      canliUrl: '',
      testUrl: '',
      aktifPasif: 'A',
      frontend: '',
      feVersion: '',
      backend: '',
      beVersion: '',
      databaseType: '',
      platform: '',
      deSorumlu: '',
      stSorumlu: '',
      complexity: '',
      customFields: [],
    };
  }

  addProject(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.editingProject = null;
    this.formState = this.createEmptyFormState();
    this.showEditor = true;
  }

  editProject(project: Project): void {
    if (!this.isAdmin()) {
      return;
    }

    this.editingProject = project;
    const customFields = project.customFields ? Object.entries(project.customFields).map(([key, value]) => ({ key, value })) : [];
    this.formState = {
      ...project,
      customFields,
    };
    this.showEditor = true;
  }

  closeEditor(): void {
    this.showEditor = false;
    this.editingProject = null;
    this.formState = this.createEmptyFormState();
  }

  addCustomField(): void {
    this.formState.customFields = [...this.formState.customFields, { key: '', value: '' }];
  }

  removeCustomField(index: number): void {
    this.formState.customFields = this.formState.customFields.filter((_, itemIndex) => itemIndex !== index);
  }

  saveProject(): void {
    if (!this.isAdmin()) {
      return;
    }

    if (!this.formState.uygulamaAdi || !this.formState.uygulamaAdi.trim()) {
    alert('Lütfen uygulama adını giriniz.'); // veya projenizdeki bildirim/toast servisi
    return;
  }

    this.isSaving = true;
    const customFieldsObject = this.formState.customFields.reduce<Record<string, string>>((acc, field) => {
      if (field.key?.trim()) {
        acc[field.key.trim()] = field.value ?? '';
      }
      return acc;
    }, {});

    const payload = {
      ...this.formState,
      customFields: customFieldsObject,
    };

    const request = this.editingProject
      ? this.projectService.updateProject(this.editingProject.id, payload)
      : this.projectService.createProject(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.showEditor = false;
        this.editingProject = null;
        this.formState = this.createEmptyFormState();
        this.fetchProjects();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Proje kaydedilirken hata oluştu', error);
      }
    });
  }

  deleteProject(projectId: number): void {
    if (!this.isAdmin()) {
      return;
    }

    if (confirm('Bu projeyi aktif/pasif yapmak istediğinize emin misiniz?')) {
      this.projectService.deleteProject(projectId).subscribe({
        next: () => {
          this.fetchProjects();
        },
        error: (error) => {
          console.error('Proje aktif/pasif yapılırken hata oluştu', error);
        }
      });
    }
  }

  onLogout(): void {
    this.authService.logout();
  }

  onSearchChange(): void {
  const term = this.searchTerm.toLowerCase().trim();
  
  // Arama terimi boşsa tüm projeleri göster
  if (!term) {
    this.filteredProjects = [...this.projects];
    return;
  }

  this.filteredProjects = this.projects.filter((project) => {
    if (this.searchField === 'all') {
      // Tüm alanlarda arama yap
      return (
        project.uygulamaAdi?.toLowerCase().includes(term) ||
        project.sektorluk?.toLowerCase().includes(term) ||
        project.tanimUygulamaAciklama?.toLowerCase().includes(term) ||
        project.frontend?.toLowerCase().includes(term) ||
        project.backend?.toLowerCase().includes(term) ||
        project.databaseType?.toLowerCase().includes(term) ||
        project.platform?.toLowerCase().includes(term) ||
        project.deSorumlu?.toLowerCase().includes(term) ||
        project.stSorumlu?.toLowerCase().includes(term)
      );
    } else {
      // Sadece seçili alanda arama yap (örn: project['frontend'])
      const value = (project as any)[this.searchField];
      return value ? value.toString().toLowerCase().includes(term) : false;
    }
  });
}
}