import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from './employee.service';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/employees';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EmployeeService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('servis başarıyla oluşturulmalı', () => {
    expect(service).toBeTruthy();
  });

  describe('getEmployees', () => {
    it('başarılı istekte çalışan dizisini dönmeli', async () => {
      const mockEmployees = [
        { id: 1, name: 'Ahmet Yılmaz', department: 'IT' },
        { id: 2, name: 'Ayşe Demir', department: 'HR' }
      ];

      const employeePromise = service.getEmployees();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmployees);

      const result = await employeePromise;
      expect(result).toEqual(mockEmployees);
    });

    it('HTTP hatası durumunda console.error loglayıp hatayı fırlatmalı', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const employeePromise = service.getEmployees();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush('Sunucu Hatası', { status: 500, statusText: 'Internal Server Error' });

      await expect(employeePromise).rejects.toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Çalışan verileri backend üzerinden çekilirken hata oluştu:',
        expect.anything()
      );

      consoleSpy.mockRestore();
    });
  });
});