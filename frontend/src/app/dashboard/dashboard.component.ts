import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from '../models/project';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';
import { EmployeeService } from '../services/employee.service';

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
  employees: any[] = [];
  isLoadingEmployees = false;
  hasEmployeeError = false;

  // Custom Modal Durumu
  dialogState: ConfirmDialogState = {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Evet',
    cancelText: 'Vazgeç',
    type: 'confirm',
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchProjects();
      this.fetchEmployees();
    }
    this.currentUser = this.authService.getUser();
  }

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private employeeService: EmployeeService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
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

  fetchProjects(): void {
    this.isLoading = true;
    this.hasError = false;

    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects = Array.isArray(data) ? data : [];
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
    return JSON.parse(JSON.stringify(state));
  }

  isFormDirty(): boolean {
    if (!this.originalFormState) return false;

    const currentValue = JSON.stringify(this.cloneFormState(this.formState));
    const originalValue = JSON.stringify(this.cloneFormState(this.originalFormState));
    return currentValue !== originalValue;
  }

  saveProject(): void {
    if (!this.isAdmin()) return;

    if (!this.formState.uygulamaAdi || !this.formState.uygulamaAdi.trim()) {
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
    this.applyFiltersAndSorting();
  }

  onSortChange(): void {
    this.applyFiltersAndSorting();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSorting();
  }

  applyFiltersAndSorting(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.aktifs = this.projects.filter((project) => project.aktifPasif === 'A').length;

    this.filteredProjects = this.projects.filter((project) => {
      if (!term) return true;

      if (this.searchField === 'all') {
        return (
          project.uygulamaAdi?.toLowerCase().includes(term) ||
          project.sektorluk?.toLowerCase().includes(term) ||
          project.tanimUygulamaAciklama?.toLowerCase().includes(term) ||
          project.frontend?.toLowerCase().includes(term) ||
          project.backend?.toLowerCase().includes(term) ||
          project.databaseType?.toLowerCase().includes(term) ||
          project.platform?.toLowerCase().includes(term) ||
          project.deSorumlu?.toLowerCase().includes(term) ||
          project.sla?.toLowerCase().includes(term) ||
          project.complexity?.toLowerCase().includes(term)
        );
      }

      const value = (project as any)[this.searchField];
      return value ? value.toString().toLowerCase().includes(term) : false;
    });

    if (this.sortField) {
      this.filteredProjects.sort((a, b) => this.compareProjects(a, b, this.sortField));
    }
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
}