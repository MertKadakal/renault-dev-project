import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: { login: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceSpy = {
      login: vi.fn()
    };
    routerSpy = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('bileşen başarıyla oluşturulmalı ve rastgele arka plan resmi atanmalı', () => {
    fixture.detectChanges(); // ngOnInit -> setRandomBackground çalışır
    expect(component).toBeTruthy();
    expect(component.randomBgImage).toMatch(/^url\('assets\/cars\/.+'\)$/);
  });

  describe('onLogin', () => {
    it('başarılı girişte dashboard sayfasına role bilgisiyle yönlendirmeli', () => {
      const mockSuccessResponse = {
        access_token: 'fake-token',
        user: { role: 'admin' }
      };
      authServiceSpy.login.mockReturnValue(of(mockSuccessResponse));

      component.username = 'ahmet';
      component.password = '123456';

      component.onLogin();

      expect(authServiceSpy.login).toHaveBeenCalledWith('ahmet', '123456');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard'], {
        state: { role: 'admin' },
        replaceUrl: true
      });
    });

    it('başarılı girişte role bilgisi yoksa state içinde role undefined gitmeli', () => {
      const mockSuccessWithoutRole = {
        access_token: 'fake-token'
      };
      authServiceSpy.login.mockReturnValue(of(mockSuccessWithoutRole));

      component.onLogin();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard'], {
        state: { role: undefined },
        replaceUrl: true
      });
    });

    it('backend özel hata mesajı döndüğünde errorMessage alanına yazmalı', () => {
      const backendError = {
        error: { message: 'Kullanıcı adı veya şifre hatalı' }
      };
      authServiceSpy.login.mockReturnValue(throwError(() => backendError));

      component.onLogin();

      expect(component.errorMessage).toBe('Kullanıcı adı veya şifre hatalı');
    });

    it('backend hata mesajı içermiyorsa varsayılan "Giriş başarısız!" mesajını göstermeli', () => {
      const genericError = {
        error: {}
      };
      authServiceSpy.login.mockReturnValue(throwError(() => genericError));

      component.onLogin();

      expect(component.errorMessage).toBe('Giriş başarısız!');
    });
  });
});