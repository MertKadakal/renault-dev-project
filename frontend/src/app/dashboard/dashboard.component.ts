import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../models/project';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { ProjectService } from '../services/project.service';

export interface Employee {
  Ipn: string;
  Identifier: string;
  Name: string;
  Surname: string;
  Email: string;
  DirectionCode: string;
  DepartmentCode: string;
  SuperiorIdentifier: string | null;
  SuperiorIpn: string | null;
  SuperiorName: string | null;
  SuperiorSurname: string | null;
  PhoneNumber1: string | null;
  PhoneNumber2: string | null;
  EmployeeType: string;
  Gender: string;
  StartDate: string;
  BirthDate: string;
  Quit: boolean;
  QuitDate: string | null;
  DepartmentName: string;
  DirectionName: string;
  PositionCode: string;
  SuperiorPositionCode: string | null;
  TitleCode: string | null;
  SuperiorTitleCode: string | null;
  /*Mids: unknown | null;*/
  Category: string | null;
  CostCenter: string;
  Workplace: string;
  HighSchool: string | null;
  University: string | null;
  TfiScore: string | null;
  ToeicScore: string | null;
  ShiftCode: string | null;
  MissionCode: string | null;
  CitizenshipNumber: string;
  Level: string | null;
  Scategory: string | null;
  CompanyCode: string;
  UniqueId: string;
  /*ValidCertificates: unknown | null;*/
  Nationality: string;
  HighschoolField: string | null;
  HighschoolGraduation: string | null;
  SuperiorDepartmentName: string | null;
  [key: string]: unknown;
}

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
  deSorumlu?: string[];
  sla?: string | null;
  complexity?: string;
  customFields: Array<{ key: string; value: string }>;
}

export interface ChartStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert' | 'danger';
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  activeTab: 'dashboard' | 'statistics' = 'dashboard';
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  aktifs: number = 0;
  searchTerm = '';
  isLoading = true;
  hasError = false;
  role: string | null = null;
  showEditor = false;
  showViewer = false;
  editingProject: Project | null = null;
  viewingProject: Project | null = null;
  formState: ProjectFormState = this.createEmptyFormState();
  originalFormState: ProjectFormState | null = null;
  isSaving = false;
  searchField: string = 'all';
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentUser: { username: string; name: string; role?: string } | null = null;
  employerOptions: string[] = [];
  readonly textLimit: number = 30;
  viewMode: 'grid' | 'table' = 'grid';
  employees: Employee[] = [];
  isLoadingEmployees = false;
  hasEmployeeError = false;

  // Sayfalama Durumu
  currentPage: number = 1;
  readonly pageSize: number = 20;
  totalPages: number = 1;
  paginatedProjects: Project[] = [];
  allStatsData: Project[] = [];

  // Custom Modal Durumu
  dialogState: ConfirmDialogState = {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Evet',
    cancelText: 'Vazgeç',
    type: 'confirm',
  };

  private searchTimeout: any;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchProjects();
      this.fetchStatisticsData(); // İlk açılışta grafikleri de doldur
      this.fetchEmployees();
    }
    this.currentUser = this.authService.getUser();
  }

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly employeeService: EmployeeService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {
    this.role = this.authService.getRole() ?? this.router.getCurrentNavigation()?.extras?.state?.['role'] ?? null;
  }

  // Dialog Kontrol Metotları
  openDialog(config: Omit<ConfirmDialogState, 'isOpen'>): void {
    this.dialogState = {
      isOpen: true,
      confirmText: 'Evet',
      cancelText: 'Vazgeç',
      type: 'confirm',
      ...config,
    };
  }

  onDialogConfirm(): void {
    const callback = this.dialogState.onConfirm;
    this.closeDialog();
    if (callback) callback();
  }

  onDialogCancel(): void {
    const callback = this.dialogState.onCancel;
    this.closeDialog();
    if (callback) callback();
  }

  closeDialog(): void {
    this.dialogState.isOpen = false;
  }

  setViewMode(mode: 'grid' | 'table'): void {
    this.viewMode = mode;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  async fetchEmployees(): Promise<void> {
    this.isLoadingEmployees = true;
    this.hasEmployeeError = false;

    try {
      this.employees = await this.employeeService.getEmployees();
      this.isLoadingEmployees = false;
      this.cdr.detectChanges();
    } catch (error) {
      this.isLoadingEmployees = false;
      this.hasEmployeeError = true;
      console.error('Çalışan verileri çekilirken hata oluştu!', error);
      this.cdr.detectChanges();
    }
  }

  totalRecords: number = 0;
  fetchProjects(): void {
    this.isLoading = true;
    this.hasError = false;

    // Servise arama parametrelerini de gönderiyoruz
    this.projectService.getProjects(this.currentPage, this.pageSize, this.searchField, this.searchTerm).subscribe({
      next: (response) => {
        this.projects = response.data || [];
        this.totalRecords = response.total || 0;
        
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize) || 1;

        this.applyFiltersAndSorting();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.hasError = true;
        console.error('Projeler çekilirken hata oluştu!', error);
      },
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
      deSorumlu: [],
      sla: '',
      complexity: '',
      customFields: [],
    };
  }

  addProject(): void {
    if (!this.isAdmin()) return;

    this.editingProject = null;
    this.formState = this.createEmptyFormState();
    this.originalFormState = this.cloneFormState(this.formState);
    this.showEditor = true;
  }

  viewProject(project: Project): void {
    this.viewingProject = project;
    const customFields = project.customFields ? Object.entries(project.customFields).map(([key, value]) => ({ key, value })) : [];
    const deSorumluArray = project.deSorumlu ? project.deSorumlu.split(',').map((s) => s.trim()).filter(Boolean) : [];
    this.formState = {
      ...project,
      deSorumlu: deSorumluArray,
      customFields,
    } as any;
    this.showViewer = true;
    this.showEditor = false;
  }

  editProject(project: Project): void {
    if (!this.isAdmin()) return;

    this.editingProject = project;
    const customFields = project.customFields ? Object.entries(project.customFields).map(([key, value]) => ({ key, value })) : [];
    const deSorumluArray = project.deSorumlu ? project.deSorumlu.split(',').map((s) => s.trim()).filter(Boolean) : [];
    this.formState = {
      ...project,
      deSorumlu: deSorumluArray,
      customFields,
    } as any;
    this.originalFormState = this.cloneFormState(this.formState);
    this.showEditor = true;
    this.showViewer = false;
  }

  closeViewer(): void {
    this.showViewer = false;
    this.viewingProject = null;
    this.formState = this.createEmptyFormState();
  }

  closeEditor(): void {
    if (this.editingProject && this.isFormDirty()) {
      this.openDialog({
        title: 'Kaydedilmemiş Değişiklikler',
        message: 'Yaptığınız değişiklikleri kaydetmek ister misiniz?',
        confirmText: 'Kaydet',
        cancelText: 'Kaydetmeden Çık',
        onConfirm: () => this.saveProject(),
        onCancel: () => this.forceCloseEditor(),
      });
      return;
    }

    this.forceCloseEditor();
  }

  private forceCloseEditor(): void {
    this.showEditor = false;
    this.editingProject = null;
    this.originalFormState = null;
    this.formState = this.createEmptyFormState();
  }

  addCustomField(): void {
    this.formState.customFields = [...this.formState.customFields, { key: '', value: '' }];
  }

  removeCustomField(index: number): void {
    this.formState.customFields = this.formState.customFields.filter((_, itemIndex) => itemIndex !== index);
  }

  cloneFormState(state: ProjectFormState): ProjectFormState {
    return structuredClone(state);
  }

  isFormDirty(): boolean {
    if (!this.originalFormState) return false;

    const currentValue = JSON.stringify(this.cloneFormState(this.formState));
    const originalValue = JSON.stringify(this.cloneFormState(this.originalFormState));
    return currentValue !== originalValue;
  }

  saveProject(): void {
    if (!this.isAdmin()) return;

    if (!this.formState.uygulamaAdi?.trim()) {
      this.openDialog({
        title: 'Eksik Bilgi',
        message: 'Lütfen uygulama adını giriniz.',
        type: 'alert',
        confirmText: 'Tamam',
      });
      return;
    }

    this.isSaving = true;
    const customFieldsObject = this.formState.customFields.reduce<Record<string, string>>((acc, field) => {
      if (field.key?.trim()) {
        acc[field.key.trim()] = field.value ?? '';
      }
      return acc;
    }, {});

    const deSorumluValue = Array.isArray(this.formState.deSorumlu) ? this.formState.deSorumlu.join(', ') : (this.formState.deSorumlu as any);

    const payload = {
      ...this.formState,
      deSorumlu: deSorumluValue,
      customFields: customFieldsObject,
    };

    const request = this.editingProject
      ? this.projectService.updateProject(this.editingProject.id, payload)
      : this.projectService.createProject(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.forceCloseEditor();
        this.fetchProjects();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Proje kaydedilirken hata oluştu', error);
      },
    });
  }

  removeDeveloper(name: string): void {
    if (!this.formState.deSorumlu) return;
    this.formState.deSorumlu = this.formState.deSorumlu.filter((n) => n !== name);
  }

  isDeveloperSelected(name: string): boolean {
    return !!this.formState.deSorumlu?.includes(name);
  }

  toggleDeveloper(name: string): void {
    if (!this.formState.deSorumlu) {
      this.formState.deSorumlu = [name];
      return;
    }

    if (this.formState.deSorumlu.includes(name)) {
      this.formState.deSorumlu = this.formState.deSorumlu.filter((n) => n !== name);
    } else {
      this.formState.deSorumlu = [...this.formState.deSorumlu, name];
    }
  }

  deleteProject(projectOrId: Project | number): void {
    if (!this.isAdmin()) return;

    const project = typeof projectOrId === 'number'
      ? this.projects.find((p) => p.id === projectOrId)
      : projectOrId;

    const projectId = typeof projectOrId === 'number' ? projectOrId : project?.id;
    if (!projectId) return;

    const isCurrentlyActive = project?.aktifPasif === 'A';
    const targetStatus = isCurrentlyActive ? 'pasif' : 'aktif';
    const projectName = project?.uygulamaAdi ? `"${project.uygulamaAdi}"` : 'Bu';

    this.openDialog({
      title: `Projeyi ${targetStatus}leştir`,
      message: `${projectName} projesini ${targetStatus} duruma getirmek istediğinize emin misiniz?`,
      type: isCurrentlyActive ? 'danger' : 'confirm',
      confirmText: 'Onayla',
      cancelText: 'Vazgeç',
      onConfirm: () => {
        this.projectService.deleteProject(projectId).subscribe({
          next: () => this.fetchProjects(),
          error: (error) => console.error(`Proje ${targetStatus} yapılırken hata oluştu`, error),
        });
      },
    });
  }

  onLogout(): void {
    this.openDialog({
      title: 'Çıkış Yap',
      message: 'Oturumunuzu kapatmak istediğinize emin misiniz?',
      confirmText: 'Çıkış Yap',
      cancelText: 'İptal',
      type: 'danger',
      onConfirm: () => this.authService.logout(),
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; 
      this.fetchProjects(); 
      this.fetchStatisticsData(); // Arama değiştiğinde grafikleri yeniden hesaplamak için tüm veriyi çek
    }, 400);
  }

  onSortChange(): void {
    this.applyFiltersAndSorting();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSorting();
  }

  applyFiltersAndSorting(): void {
    // ARTIK FİLTRELEMEYİ İPTAL EDİYORUZ (Çünkü backend zaten filtrelenmiş 6 veriyi getirdi)
    // Sadece diziyi kopyalıyoruz
    this.filteredProjects = [...this.projects];

    // Aktif sayısını hesapla
    this.aktifs = this.filteredProjects.filter((project) => project.aktifPasif === 'A').length;

    // Client-side sıralama devam edebilir (o anki 20 veya daha az kayıt üzerinde çalışır)
    if (this.sortField) {
      this.filteredProjects.sort((a, b) => this.compareProjects(a, b, this.sortField));
    }

    this.paginatedProjects = this.filteredProjects;
  }

  compareProjects(a: Project, b: Project, field: string): number {
    const aValue = this.normalizeSortValue((a as any)[field]);
    const bValue = this.normalizeSortValue((b as any)[field]);

    if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
    return 0;
  }

  normalizeSortValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  }

  truncateText(value: string | null | undefined, maxLength = 30): string {
    if (!value) return '';
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  }

  getCustomFieldsText(project: Project): string {
    if (!project.customFields) return '';
    return Object.entries(project.customFields)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  backendStats: ChartStat[] = [];
  backendGradient: string = '';

  frontendStats: ChartStat[] = [];
  frontendGradient: string = '';

  sektorlukStats: ChartStat[] = [];
  sektorlukGradient: string = '';

  databaseStats: ChartStat[] = [];
  databaseGradient: string = '';

  platformStats: ChartStat[] = [];
  platformGradient: string = '';

  developerStats: ChartStat[] = [];
  developerGradient: string = '';

  // Tüm istatistikleri aynı anda hesaplayan ana fonksiyon
  calculateAllStats(): void {
    if (!this.allStatsData || this.allStatsData.length === 0) {
      this.resetStats();
      return;
    }

    const backendData = this.calculateFieldStats('backend');
    this.backendStats = backendData.stats;
    this.backendGradient = backendData.gradient;

    const frontendData = this.calculateFieldStats('frontend');
    this.frontendStats = frontendData.stats;
    this.frontendGradient = frontendData.gradient;

    const sektorlukData = this.calculateFieldStats('sektorluk');
    this.sektorlukStats = sektorlukData.stats;
    this.sektorlukGradient = sektorlukData.gradient;

    const databaseData = this.calculateFieldStats('databaseType');
    this.databaseStats = databaseData.stats;
    this.databaseGradient = databaseData.gradient;

    const platformData = this.calculateFieldStats('platform');
    this.platformStats = platformData.stats;
    this.platformGradient = platformData.gradient;

    const developerData = this.calculateFieldStats('deSorumlu'); 
    this.developerStats = developerData.stats;
    this.developerGradient = developerData.gradient;
  }

  // Boş durumda verileri sıfırlamak için
  private resetStats(): void {
    this.backendStats = this.frontendStats = this.sektorlukStats = this.databaseStats = this.platformStats = this.developerStats = [];
    this.backendGradient = this.frontendGradient = this.sektorlukGradient = this.databaseGradient = this.platformGradient = this.developerGradient = '';
  }

  // Dinamik olarak gönderilen alana (field) göre grafik verisi üreten metod
  private calculateFieldStats(field: string, isCommaSeparated: boolean = false): { stats: ChartStat[], gradient: string } {
    const counts: Record<string, number> = {};
    let totalItems = 0; // totalProjects yerine totalItems kullanıyoruz çünkü 1 projede 3 kişi olabilir

    this.allStatsData.forEach(p => {
      const rawValue = (p as any)[field];

      // Eğer alan virgülle ayrılmış isimler içeriyorsa (örn: deSorumlu)
      if (isCommaSeparated && rawValue && typeof rawValue === 'string') {
        // İsimleri virgüllerden böl, boşlukları temizle ve boş olanları çıkar
        const names = rawValue.split(',').map(s => s.trim()).filter(Boolean);
        
        if (names.length > 0) {
          names.forEach(name => {
            counts[name] = (counts[name] || 0) + 1;
            totalItems++;
          });
        } else {
          counts['Belirtilmemiş'] = (counts['Belirtilmemiş'] || 0) + 1;
          totalItems++;
        }
      } 
      // Standart (tekli) alanlar için
      else {
        const name = rawValue && typeof rawValue === 'string' && rawValue.trim() !== '' 
          ? rawValue.trim() 
          : 'Belirtilmemiş';
        
        counts[name] = (counts[name] || 0) + 1;
        totalItems++;
      }
    });

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#8AC926', '#1982C4', '#F15BB5', '#00BBF9',
      '#E74C3C', '#2ECC71', '#34495E'
    ];

    let stats: ChartStat[] = Object.keys(counts).map((key, index) => {
      const count = counts[key];
      const percentage = (count / totalItems) * 100;
      
      return {
        name: key,
        count: count,
        percentage: Number(percentage.toFixed(1)),
        color: colors[index % colors.length]
      };
    });

    stats.sort((a, b) => b.count - a.count);

    let gradientParts: string[] = [];
    let currentPercentage = 0;

    stats.forEach(stat => {
      const start = currentPercentage;
      const end = currentPercentage + stat.percentage;
      gradientParts.push(`${stat.color} ${start}% ${end}%`);
      currentPercentage = end;
    });

    return {
      stats,
      gradient: gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(', ')})` : ''
    };
  }

  // Fare ile üzerine gelinen dilim ve koordinat bilgisi
  hoveredSlice: {
    chartType: string;
    stat: ChartStat | null;
    x: number;
    y: number;
  } | null = null;

  // Fare pasta grafiği üzerinde hareket ettiğinde açıyı ve ilgili dilimi hesaplar
  onChartMouseMove(event: MouseEvent, stats: ChartStat[], chartType: string): void {
    if (!stats || stats.length === 0) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Dairenin merkez noktası
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    // Conic-gradient saat 12 yönünden (üstten) başlayıp saat yönünde ilerler
    let deg = (Math.atan2(dy, dx) * (180 / Math.PI)) + 90;
    if (deg < 0) {
      deg += 360;
    }

    // Açıyı yüzdeye çevir (%0 - %100)
    const mousePercentage = (deg / 360) * 100;

    // Hangi dilim aralığına denk geldiğini bul
    let currentPercentage = 0;
    let foundStat: ChartStat | null = null;

    for (const stat of stats) {
      const nextPercentage = currentPercentage + stat.percentage;
      if (mousePercentage >= currentPercentage && mousePercentage <= nextPercentage) {
        foundStat = stat;
        break;
      }
      currentPercentage = nextPercentage;
    }

    // Son dilimdeki ufak ondalık yuvarlama sapmalarını yakalamak için
    if (!foundStat && stats.length > 0) {
      foundStat = stats[stats.length - 1];
    }

    this.hoveredSlice = {
      chartType,
      stat: foundStat,
      x: event.clientX,
      y: event.clientY
    };
  }

  // Fare grafikten çıktığında tooltip'i gizle
  onChartMouseLeave(): void {
    this.hoveredSlice = null;
  }


  // Bu üç metodu aşağıdaki gibi güncelle (updatePagination yerine fetchProjects çağırıyoruz)
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchProjects(); // Yeni sayfayı backend'den iste
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchProjects(); // Yeni sayfayı backend'den iste
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchProjects(); // Yeni sayfayı backend'den iste
    }
  }

  // dashboard.ts içine ekleyin:
  get pageStart(): number {
    if (this.totalRecords === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  fetchStatisticsData(): void {
    // limit parametresini 0 (limitsiz) olarak gönderiyoruz
    this.projectService.getProjects(1, 0, this.searchField, this.searchTerm).subscribe({
      next: (response) => {
        this.allStatsData = response.data || [];
        this.calculateAllStats(); // Veri gelince grafikleri hesapla
      },
      error: (error) => {
        console.error('İstatistik verileri çekilirken hata oluştu!', error);
      },
    });
  }
}