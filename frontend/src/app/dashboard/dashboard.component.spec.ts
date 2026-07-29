import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: { getCurrentNavigation: () => null } },
        { provide: AuthService, useValue: { logout: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects through the API proxy and clear loading state', () => {
    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');

    req.flush([{ uygulamaAdi: 'Test Proje' }]);

    expect(component.isLoading).toBeFalse();
    expect(component.allProjects).toHaveLength(1);
    expect(component.filteredProjects).toHaveLength(1);
  });
});
