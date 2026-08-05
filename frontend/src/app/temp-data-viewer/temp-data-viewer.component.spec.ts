import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TempDataViewerComponent } from './temp-data-viewer.component';

describe('TempDataViewerComponent', () => {
  let component: TempDataViewerComponent;
  let fixture: ComponentFixture<TempDataViewerComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TempDataViewerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'fake-test-token' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TempDataViewerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('token ile HTTP isteği yapıp gelen veriyi göstermeli', () => {
    fixture.detectChanges(); // ngOnInit tetiklenir

    const req = httpMock.expectOne('http://localhost:3000/api/temp-link/fake-test-token');
    expect(req.request.method).toBe('GET');

    // Sahte veri dönüyoruz
    const mockData = { id: 1, name: 'Angular Test' };
    req.flush(mockData);

    expect(component.jsonData()).toEqual(mockData);
    expect(component.loading()).toBeFalsy();
  });
});