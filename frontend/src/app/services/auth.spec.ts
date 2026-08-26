import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Router için spy nesnesi
    routerSpy = {
      navigate: vi.fn()
    };

    // localStorage'ı her test öncesi temizle
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('servis başarıyla oluşturulmalı', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('başarılı girişte access_token, user ve role bilgilerini localStorage alanına kaydetmeli', () => {
      const mockResponse = {
        access_token: 'fake-jwt-token',
        user: {
          username: 'ahmet',
          name: 'Ahmet Yılmaz',
          role: 'admin'
        }
      };

      service.login('ahmet', '123456').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'ahmet', pass: '123456' });

      req.flush(mockResponse);

      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(localStorage.getItem('role')).toBe('admin');
    });

    it('yanıtta token veya user bilgisi yoksa ilgili localStorage alanlarını doldurmamalı', () => {
      const emptyResponse = {};

      service.login('test', 'test').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(emptyResponse);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
    });

    it('yanıtta user var fakat role yoksa role localStorage alanını set etmemeli', () => {
      const userWithoutRoleResponse = {
        user: {
          username: 'mehmet',
          name: 'Mehmet'
        }
      };

      service.login('mehmet', 'pass').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(userWithoutRoleResponse);

      expect(localStorage.getItem('user')).toBe(JSON.stringify(userWithoutRoleResponse.user));
      expect(localStorage.getItem('role')).toBeNull();
    });
  });

  describe('getRole', () => {
    it('localStorage içinde role varsa dönmeli', () => {
      localStorage.setItem('role', 'manager');
      expect(service.getRole()).toBe('manager');
    });

    it('localStorage içinde role yoksa null dönmeli', () => {
      expect(service.getRole()).toBeNull();
    });
  });

  describe('getUser', () => {
    it('localStorage içinde user varsa JSON parse edilmiş nesneyi dönmeli', () => {
      const mockUser = { username: 'testuser', name: 'Test User', role: 'developer' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      expect(service.getUser()).toEqual(mockUser);
    });

    it('localStorage içinde user yoksa null dönmeli', () => {
      expect(service.getUser()).toBeNull();
    });
  });

  describe('logout', () => {
    it('localStorage verilerini temizlemeli ve login sayfasına yönlendirmeli', () => {
      localStorage.setItem('token', 'some-token');
      localStorage.setItem('role', 'admin');

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    });
  });
});