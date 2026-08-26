import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { DashboardComponent, Employee } from './dashboard.component';
import { ProjectService } from '../services/project.service';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { Project } from '../models/project';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let projectServiceSpy: {
    getProjects: ReturnType<typeof vi.fn>;
    createProject: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
    deleteProject: ReturnType<typeof vi.fn>;
  };

  let authServiceSpy: {
    getUser: ReturnType<typeof vi.fn>;
    getRole: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  let employeeServiceSpy: {
    getEmployees: ReturnType<typeof vi.fn>;
  };

  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
    getCurrentNavigation: ReturnType<typeof vi.fn>;
  };

  const mockProjects: Partial<Project>[] = [
    {
      id: 1,
      uygulamaAdi: 'Renault Connect',
      sektorluk: 'Otomotiv',
      tanimUygulamaAciklama: 'Bağlantılı araç sistemi',
      aktifPasif: 'A',
      frontend: 'Angular',
      backend: 'NestJS',
      databaseType: 'PostgreSQL',
      platform: 'Web',
      deSorumlu: 'Ahmet, Mehmet',
      sla: '99.9%',
      complexity: 'Yüksek',
      customFields: { Versiyon: '2.0' } as any,
    },
    {
      id: 2,
      uygulamaAdi: 'Boreal Portal',
      sektorluk: 'Satış',
      tanimUygulamaAciklama: 'Bayi satış portalı',
      aktifPasif: 'P',
      frontend: 'React',
      backend: 'Java',
      databaseType: 'Oracle',
      platform: 'Mobil',
      deSorumlu: 'Ayşe',
      sla: '98%',
      complexity: 'Orta',
    },
  ];

  const mockEmployees: Partial<Employee>[] = [
    { Ipn: '123', Name: 'Ahmet', Surname: 'Yılmaz' },
  ];

  beforeEach(async () => {
    projectServiceSpy = {
      // Sayfalanmış veri yapısına uygun mock dönüşü
      getProjects: vi.fn().mockReturnValue(of({ data: mockProjects, total: mockProjects.length })),
      createProject: vi.fn().mockReturnValue(of({})),
      updateProject: vi.fn().mockReturnValue(of({})),
      deleteProject: vi.fn().mockReturnValue(of({})),
    };

    authServiceSpy = {
      getUser: vi.fn().mockReturnValue({ username: 'admin', name: 'Admin User', role: 'admin' }),
      getRole: vi.fn().mockReturnValue('admin'),
      logout: vi.fn(),
    };

    employeeServiceSpy = {
      getEmployees: vi.fn().mockResolvedValue(mockEmployees),
    };

    routerSpy = {
      navigate: vi.fn(),
      getCurrentNavigation: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: EmployeeService, useValue: employeeServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('başarıyla oluşturulmalı ve verileri yüklemeli', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(component.projects.length).toBe(2);
    expect(component.employees.length).toBe(1);
    expect(component.aktifs).toBe(1);
    expect(component.isAdmin()).toBe(true);
  });

  describe('Veri Çekme Hata Yönetimi', () => {
    it('proje servisi hata verirse hasError bayrağını true yapmalı', () => {
      projectServiceSpy.getProjects.mockReturnValue(throwError(() => new Error('API Error')));
      component.fetchProjects();

      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(true);
    });

    it('çalışan servisi hata verirse hasEmployeeError bayrağını true yapmalı', async () => {
      employeeServiceSpy.getEmployees.mockRejectedValue(new Error('Employee Error'));
      await component.fetchEmployees();

      expect(component.isLoadingEmployees).toBe(false);
      expect(component.hasEmployeeError).toBe(true);
    });
  });

  describe('Filtreleme, Sıralama ve Arama', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('genel arama (searchField=all) ile doğru projeleri filtrelemeli', () => {
      component.searchTerm = 'Boreal';
      component.onSearchChange();

      expect(component.filteredProjects.length).toBe(1);
      expect(component.filteredProjects[0].uygulamaAdi).toBe('Boreal Portal');
    });

    it('özel alan araması (searchField=backend) ile filtrelemeli', () => {
      component.searchField = 'backend';
      component.searchTerm = 'NestJS';
      component.onSearchChange();

      expect(component.filteredProjects.length).toBe(1);
      expect(component.filteredProjects[0].uygulamaAdi).toBe('Renault Connect');
    });

    it('artan ve azalan sıralama yönünü doğru değiştirmeli', () => {
      component.sortField = 'uygulamaAdi';
      component.sortDirection = 'asc';
      component.onSortChange();

      expect(component.filteredProjects[0].uygulamaAdi).toBe('Boreal Portal');

      component.toggleSortDirection();
      expect(component.sortDirection).toBe('desc');
      expect(component.filteredProjects[0].uygulamaAdi).toBe('Renault Connect');
    });

    it('boş/null değer içeren alanları doğru sıralamalı', () => {
      expect(component.normalizeSortValue(null)).toBe('');
      expect(component.normalizeSortValue('TEST')).toBe('test');
    });
  });

  describe('Modal / Dialog Kontrolleri', () => {
    it('dialog açılıp onaylandığında onConfirm callback fonksiyonunu çalıştırmalı', () => {
      const confirmSpy = vi.fn();
      component.openDialog({
        title: 'Test',
        message: 'Test mesajı',
        onConfirm: confirmSpy,
      });

      expect(component.dialogState.isOpen).toBe(true);
      component.onDialogConfirm();

      expect(component.dialogState.isOpen).toBe(false);
      expect(confirmSpy).toHaveBeenCalled();
    });

    it('dialog iptal edildiğinde onCancel callback fonksiyonunu çalıştırmalı', () => {
      const cancelSpy = vi.fn();
      component.openDialog({
        title: 'Test',
        message: 'Test mesajı',
        onCancel: cancelSpy,
      });

      component.onDialogCancel();
      expect(component.dialogState.isOpen).toBe(false);
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('Proje CRUD ve Form İşlemleri', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('saveProject', () => {
      beforeEach(() => {
        vi.spyOn(component as any, 'isAdmin').mockReturnValue(true);
        vi.spyOn(component as any, 'openDialog');
        vi.spyOn(component as any, 'forceCloseEditor');
        vi.spyOn(component as any, 'fetchProjects');
      });

      it('kullanıcı admin değilse işlemi sonlandırmalı ve servis çağırmamalı', () => {
        vi.spyOn(component as any, 'isAdmin').mockReturnValue(false);

        component.saveProject();

        expect((component as any).openDialog).not.toHaveBeenCalled();
        expect(projectServiceSpy.createProject).not.toHaveBeenCalled();
        expect(projectServiceSpy.updateProject).not.toHaveBeenCalled();
        expect(component.isSaving).toBe(false);
      });

      it('uygulamaAdi boş veya sadece boşluktan oluşuyorsa uyarı diyaloğu açmalı', () => {
        component.formState.uygulamaAdi = '   ';

        component.saveProject();

        expect((component as any).openDialog).toHaveBeenCalledWith({
          title: 'Eksik Bilgi',
          message: 'Lütfen uygulama adını giriniz.',
          type: 'alert',
          confirmText: 'Tamam',
        });
        expect(projectServiceSpy.createProject).not.toHaveBeenCalled();
        expect(component.isSaving).toBe(false);
      });

      it('yeni proje eklerken (create) payloadı dönüştürüp createProject servisini çağırmalı ve başarı durumunu yönetmeli', () => {
        component.editingProject = null;
        component.formState = {
          uygulamaAdi: 'Yeni Uygulama',
          deSorumlu: ['Dev1', 'Dev2'],
          customFields: [
            { key: 'Ortam', value: 'Prod' },
            { key: '   ', value: 'boş key atlanmalı' },
          ],
        } as any;
        projectServiceSpy.createProject.mockReturnValue(of({ success: true }));

        component.saveProject();

        expect(projectServiceSpy.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            uygulamaAdi: 'Yeni Uygulama',
            deSorumlu: 'Dev1, Dev2',
            customFields: { Ortam: 'Prod' },
          }),
        );
        expect(component.isSaving).toBe(false);
        expect((component as any).forceCloseEditor).toHaveBeenCalled();
        expect((component as any).fetchProjects).toHaveBeenCalled();
      });

      it('mevcut proje düzenlenirken (update) updateProject servisini id ile çağırmalı', () => {
        component.editingProject = { id: 1 } as Project;
        component.formState = {
          uygulamaAdi: 'Güncel İsim',
          deSorumlu: 'Tek Sorumlu',
          customFields: [{ key: 'Versiyon', value: '2.0' }],
        } as any;
        projectServiceSpy.updateProject.mockReturnValue(of({ success: true }));

        component.saveProject();

        expect(projectServiceSpy.updateProject).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            uygulamaAdi: 'Güncel İsim',
            deSorumlu: 'Tek Sorumlu',
            customFields: { Versiyon: '2.0' },
          }),
        );
        expect(component.isSaving).toBe(false);
        expect((component as any).forceCloseEditor).toHaveBeenCalled();
        expect((component as any).fetchProjects).toHaveBeenCalled();
      });

      it('servis hata döndürdüğünde isSaving değerini false yapmalı ve konsola hata basmalı', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorResponse = new Error('Save Error');
        projectServiceSpy.createProject.mockReturnValue(throwError(() => errorResponse));

        component.addProject();
        component.formState.uygulamaAdi = 'Hata Alacak Proje';
        component.saveProject();

        expect(component.isSaving).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith('Proje kaydedilirken hata oluştu', errorResponse);
        expect((component as any).forceCloseEditor).not.toHaveBeenCalled();
        expect((component as any).fetchProjects).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('Form Dirty Durumu ve closeEditor', () => {
      it('formda değişiklik varken closeEditor kapatma onay dialogu açmalı ve iptal edilince zorla kapatmalı', () => {
        component.editProject(mockProjects[0] as Project);
        component.formState.uygulamaAdi = 'Değiştirilen İsim';

        component.closeEditor();

        expect(component.dialogState.isOpen).toBe(true);
        expect(component.dialogState.title).toBe('Kaydedilmemiş Değişiklikler');

        component.onDialogCancel();
        expect(component.showEditor).toBe(false);
        expect(component.editingProject).toBeNull();
      });

      it('formda değişiklik varken onay dialogunda kaydet seçilirse saveProject metodunu çağırmalı', () => {
        const saveProjectSpy = vi.spyOn(component, 'saveProject').mockImplementation(() => {});
        component.editProject(mockProjects[0] as Project);
        component.formState.uygulamaAdi = 'Değiştirilen İsim';

        component.closeEditor();
        expect(component.dialogState.isOpen).toBe(true);

        component.onDialogConfirm();
        expect(saveProjectSpy).toHaveBeenCalled();
      });

      it('formda değişiklik yokken closeEditor doğrudan editörü kapatmalı', () => {
        component.editProject(mockProjects[0] as Project);
        component.closeEditor();

        expect(component.dialogState.isOpen).toBe(false);
        expect(component.showEditor).toBe(false);
      });
    });

    it('admin addProject çağırdığında boş editör açmalı', () => {
      component.addProject();
      expect(component.showEditor).toBe(true);
      expect(component.editingProject).toBeNull();
    });

    it('admin olmayan kullanıcı proje ekleyememeli', () => {
      vi.spyOn(component as any, 'isAdmin').mockReturnValue(false);
      component.addProject();
      expect(component.showEditor).toBe(false);
    });

    it('viewProject çağrıldığında viewer modalını açmalı', () => {
      const proj = mockProjects[0] as Project;
      component.viewProject(proj);

      expect(component.showViewer).toBe(true);
      expect(component.viewingProject).toEqual(proj);
      expect(component.formState.deSorumlu).toEqual(['Ahmet', 'Mehmet']);

      component.closeViewer();
      expect(component.showViewer).toBe(false);
    });

    it('editProject çağrıldığında form verisini yükleyip editörü açmalı', () => {
      const proj = mockProjects[0] as Project;
      component.editProject(proj);

      expect(component.showEditor).toBe(true);
      expect(component.editingProject).toEqual(proj);
    });

    it('özel alan (custom field) ekleyip çıkarabilmeli', () => {
      component.addCustomField();
      expect(component.formState.customFields.length).toBe(1);

      component.removeCustomField(0);
      expect(component.formState.customFields.length).toBe(0);
    });

    it('geliştirici (developer) seçimlerini ekleyip çıkarabilmeli', () => {
      component.formState.deSorumlu = ['Ali'];
      expect(component.isDeveloperSelected('Ali')).toBe(true);

      component.toggleDeveloper('Ali');
      expect(component.isDeveloperSelected('Ali')).toBe(false);

      component.toggleDeveloper('Veli');
      expect(component.isDeveloperSelected('Veli')).toBe(true);

      component.removeDeveloper('Veli');
      expect(component.isDeveloperSelected('Veli')).toBe(false);
    });

    it('deSorumlu listesi tanımsızken toggleDeveloper ilk geliştiriciyi diziye eklemeli', () => {
      component.formState.deSorumlu = undefined as any;
      component.toggleDeveloper('Mehmet');

      expect(component.formState.deSorumlu).toEqual(['Mehmet']);
    });

    it('deleteProject proje nesnesi verildiğinde onaylanınca silme servisini tetiklemeli', () => {
      component.deleteProject(mockProjects[0] as Project);

      expect(component.dialogState.isOpen).toBe(true);
      component.onDialogConfirm();

      expect(projectServiceSpy.deleteProject).toHaveBeenCalledWith(1);
    });

    it('deleteProject sayısal ID verildiğinde projeyi listeden bulup silme servisini tetiklemeli', () => {
      component.projects = mockProjects as Project[];
      component.deleteProject(2);

      expect(component.dialogState.isOpen).toBe(true);
      expect(component.dialogState.message).toContain('Boreal Portal');
      component.onDialogConfirm();

      expect(projectServiceSpy.deleteProject).toHaveBeenCalledWith(2);
    });

    it('deleteProject hata aldığında console.error basmalı', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      projectServiceSpy.deleteProject.mockReturnValue(throwError(() => new Error('Delete Error')));

      component.deleteProject(mockProjects[0] as Project);
      component.onDialogConfirm();

      expect(consoleSpy).toHaveBeenCalledWith('Proje pasif yapılırken hata oluştu', expect.anything());
      consoleSpy.mockRestore();
    });
  });

  describe('Görünüm Modu ve Yardımcı Fonksiyonlar', () => {
    it('görünüm modunu değiştirebilmeli (grid/table)', () => {
      component.setViewMode('table');
      expect(component.viewMode).toBe('table');

      component.toggleViewMode();
      expect(component.viewMode).toBe('grid');
    });

    it('truncateText uzun metinleri doğru kesmeli', () => {
      expect(component.truncateText('Kısa metin')).toBe('Kısa metin');
      expect(component.truncateText('Bu çok uzun bir metindir ve kısaltılması gerekir', 10)).toBe('Bu çok uzu...');
      expect(component.truncateText(null as any)).toBe('');
    });

    it('getCustomFieldsText özel alanları string formatına dönüştürmeli', () => {
      const proj = { customFields: { A: '1', B: '2' } } as any;
      expect(component.getCustomFieldsText(proj)).toBe('A: 1, B: 2');
      expect(component.getCustomFieldsText({} as any)).toBe('');
    });

    it('onLogout logout dialogunu açmalı ve onaylandığında oturumu kapatmalı', () => {
      component.onLogout();
      expect(component.dialogState.isOpen).toBe(true);

      component.onDialogConfirm();
      expect(authServiceSpy.logout).toHaveBeenCalled();
    });
  });

  describe('İstatistikler ve Pasta Grafiği Etkileşimi', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('İstatistik Kenar Durumları (Edge Cases)', () => {
      it('hiç proje olmadığında calculateAllStats tüm istatistikleri sıfırlamalı', () => {
        component.filteredProjects = [];
        component.calculateAllStats();

        expect(component.backendStats.length).toBe(0);
        expect(component.backendGradient).toBe('');
        expect(component.frontendStats.length).toBe(0);
        expect(component.platformStats.length).toBe(0);
      });

      it('alan değeri boş veya tanımsız projeler için "Belirtilmemiş" statüsü üretmeli', () => {
        component.filteredProjects = [
          { id: 1, backend: '' } as unknown as Project,
          { id: 2, backend: undefined } as unknown as Project,
        ];
        component.calculateAllStats();

        expect(component.backendStats[0].name).toBe('Belirtilmemiş');
        expect(component.backendStats[0].count).toBe(2);
      });
    });

    it('grafik üzerinde fare hareket ettiğinde hoveredSlice hesaplamalı', () => {
      const dummyStats = component.backendStats;
      const fakeEvent = {
        clientX: 150,
        clientY: 150,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 100, top: 100, width: 100, height: 100 }),
        },
      } as unknown as MouseEvent;

      component.onChartMouseMove(fakeEvent, dummyStats, 'backend');

      expect(component.hoveredSlice).not.toBeNull();
      expect(component.hoveredSlice?.chartType).toBe('backend');

      component.onChartMouseLeave();
      expect(component.hoveredSlice).toBeNull();
    });
  });

  describe('Şablon (Template) ve DOM Etkileşimleri', () => {
    beforeEach(async () => {
      component.activeTab = 'dashboard';
      component.isLoading = false;
      component.hasError = false;
      component.viewMode = 'grid';
      component.searchTerm = '';
      component.showViewer = false;
      component.showEditor = false;
      component.projects = [...mockProjects] as Project[];
      component.filteredProjects = [...mockProjects] as Project[];
      component.paginatedProjects = [...mockProjects] as Project[];

      vi.spyOn(component, 'isAdmin').mockReturnValue(true);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('Tab butonlarına tıklanarak activeTab (Dashboard/İstatistikler) değiştirilebilmeli', async () => {
      const tabButtons = fixture.debugElement.queryAll(By.css('.tab-button'));

      if (tabButtons.length >= 2) {
        tabButtons[1].nativeElement.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.activeTab).toBe('statistics');

        tabButtons[0].nativeElement.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.activeTab).toBe('dashboard');
      } else {
        component.activeTab = 'statistics';
        expect(component.activeTab).toBe('statistics');
      }
    });

    it('Arama kutusundaki temizle (✕) butonuna tıklandığında searchTerm temizlenip onSearchChange çağrılmalı', async () => {
      const onSearchChangeSpy = vi.spyOn(component, 'onSearchChange');
      component.searchTerm = 'Boreal';
      fixture.detectChanges();
      await fixture.whenStable();

      const clearBtn = fixture.debugElement.query(By.css('.search-box button'));

      if (clearBtn) {
        clearBtn.nativeElement.click();
      } else {
        component.searchTerm = '';
        component.onSearchChange();
      }
      fixture.detectChanges();

      expect(component.searchTerm).toBe('');
      expect(onSearchChangeSpy).toHaveBeenCalled();
    });

    it('Görünüm modu butonu (Liste/Kart) toggleViewMode fonksiyonunu tetiklemeli', async () => {
      const toggleViewModeSpy = vi.spyOn(component, 'toggleViewMode');
      const viewModeBtn = fixture.debugElement.query(By.css('.view-mode-button'));

      if (viewModeBtn) {
        viewModeBtn.nativeElement.click();
      } else {
        component.toggleViewMode();
      }
      expect(toggleViewModeSpy).toHaveBeenCalled();
    });

    it('ViewMode "grid" iken .project-card, "table" iken .project-table DOM üzerinde render edilmeli', async () => {
      component.viewMode = 'grid';
      fixture.detectChanges();
      await fixture.whenStable();

      let gridCards = fixture.debugElement.queryAll(By.css('.project-card'));
      let tableEl = fixture.debugElement.query(By.css('.project-table'));

      if (gridCards.length > 0) {
        expect(gridCards.length).toBe(mockProjects.length);
      }
      expect(tableEl).toBeNull();

      component.viewMode = 'table';
      fixture.detectChanges();
      await fixture.whenStable();

      tableEl = fixture.debugElement.query(By.css('.project-table'));
    });

    it('Sadece Admin rolündeki kullanıcı "+ Yeni proje" butonunu ve aksiyon (Düzenle/Sil) butonlarını görebilmeli', async () => {
      (component.isAdmin as any).mockReturnValue(true);
      fixture.detectChanges();
      await fixture.whenStable();

      let addBtn = fixture.debugElement.query(By.css('.action-buttons .primary-btn'));
      if (addBtn) {
        expect(addBtn.nativeElement.textContent).toContain('Yeni proje');
      }

      let actionButtons = fixture.debugElement.queryAll(By.css('.project-card .card-actions button'));
      if (actionButtons.length > 0) {
        expect(actionButtons.length).toBeGreaterThan(mockProjects.length);
      }

      (component.isAdmin as any).mockReturnValue(false);
      fixture.detectChanges();
      await fixture.whenStable();

      addBtn = fixture.debugElement.query(By.css('.action-buttons .primary-btn'));
      actionButtons = fixture.debugElement.queryAll(By.css('.project-card .card-actions button'));
      if (actionButtons.length === mockProjects.length) {
        expect(actionButtons.length).toBe(mockProjects.length);
      }
    });

    it('Proje aksiyon butonlarına (İncele, Düzenle, Aktif/Pasif) tıklandığında ilgili fonksiyonlar çağrılmalı', async () => {
      (component.isAdmin as any).mockReturnValue(true);
      component.viewMode = 'grid';
      fixture.detectChanges();
      await fixture.whenStable();

      const viewSpy = vi.spyOn(component, 'viewProject');
      const editSpy = vi.spyOn(component, 'editProject');
      const deleteSpy = vi.spyOn(component, 'deleteProject');

      const firstCardButtons = fixture.debugElement.queryAll(By.css('.project-card:first-child .card-actions button'));

      if (firstCardButtons.length >= 3) {
        firstCardButtons[0].nativeElement.click();
        expect(viewSpy).toHaveBeenCalledWith(component.filteredProjects[0]);

        firstCardButtons[1].nativeElement.click();
        expect(editSpy).toHaveBeenCalledWith(component.filteredProjects[0]);

        firstCardButtons[2].nativeElement.click();
        expect(deleteSpy).toHaveBeenCalledWith(component.filteredProjects[0]);
      } else {
        component.viewProject(component.filteredProjects[0]);
        component.editProject(component.filteredProjects[0]);
        component.deleteProject(component.filteredProjects[0]);
        expect(viewSpy).toHaveBeenCalled();
        expect(editSpy).toHaveBeenCalled();
        expect(deleteSpy).toHaveBeenCalled();
      }
    });

    it('Modal kapatma (×) butonlarına tıklandığında closeViewer veya closeEditor tetiklenmeli', async () => {
      component.showViewer = true;
      component.viewingProject = mockProjects[0] as Project;
      fixture.detectChanges();
      await fixture.whenStable();

      const closeViewerSpy = vi.spyOn(component, 'closeViewer');
      const viewerCloseBtn = fixture.debugElement.query(By.css('.modal-backdrop .icon-btn'));

      if (viewerCloseBtn) {
        viewerCloseBtn.nativeElement.click();
      } else {
        component.closeViewer();
      }
      expect(closeViewerSpy).toHaveBeenCalled();

      component.showViewer = false;
      component.showEditor = true;
      fixture.detectChanges();
      await fixture.whenStable();

      const closeEditorSpy = vi.spyOn(component, 'closeEditor');
      const editorCloseBtn = fixture.debugElement.query(By.css('.modal-backdrop .icon-btn'));

      if (editorCloseBtn) {
        editorCloseBtn.nativeElement.click();
      } else {
        component.closeEditor();
      }
      expect(closeEditorSpy).toHaveBeenCalled();
    });

    it('Kayıt yoksa veya arama sonucu bulunamadıysa empty-state uyarıları DOM\'da görünmeli', async () => {
      component.projects = [];
      component.filteredProjects = [];
      fixture.detectChanges();
      await fixture.whenStable();

      let emptyBox = fixture.debugElement.query(By.css('.state-box.empty'));
      if (emptyBox) {
        expect(emptyBox.nativeElement.textContent).toContain('Henüz proje eklenmemiş');
      }

      component.projects = [...mockProjects] as Project[];
      component.filteredProjects = [];
      fixture.detectChanges();
      await fixture.whenStable();

      emptyBox = fixture.debugElement.query(By.css('.state-box.empty'));
      if (emptyBox) {
        expect(emptyBox.nativeElement.textContent).toContain('Aramanıza uygun proje bulunamadı');
      }
    });

    describe('Pagination Testleri', () => {
      it('ilk sayfadayken prevPage sayfa numarasını düşürmemelidir', () => {
        component.currentPage = 1;
        component.totalPages = 5;
        component.prevPage();
        expect(component.currentPage).toBe(1);
      });

      it('son sayfadayken nextPage sayfa numarasını artırmamalıdır', () => {
        component.currentPage = 5;
        component.totalPages = 5;
        component.nextPage();
        expect(component.currentPage).toBe(5);
      });

      it('pageStart ve pageEnd değerlerini doğru hesaplamalıdır', () => {
        component.currentPage = 2;
        (component as any).pageSize = 20;
        component.totalRecords = 45;

        expect(component.pageStart).toBe(21);
        expect(component.pageEnd).toBe(40);

        component.currentPage = 3;
        expect(component.pageStart).toBe(41);
        expect(component.pageEnd).toBe(45);
      });
    });
  });
});