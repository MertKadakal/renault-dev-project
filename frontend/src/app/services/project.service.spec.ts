import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { Project } from '../models/project';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/projects/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('servis başarıyla oluşturulmalı', () => {
    expect(service).toBeTruthy();
  });

  describe('getProjects', () => {
    it('iç içe dizi şeklinde gelen yanıtı (response[0]) düzgünce dönmeli', () => {
      const mockNestedData = [
        [
          { id: 1, uygulamaAdi: 'Proje 1' } as unknown as Project,
          { id: 2, uygulamaAdi: 'Proje 2' } as unknown as Project
        ]
      ];

      service.getProjects().subscribe(projects => {
        expect(projects.length).toBe(2);
        expect(projects).toEqual(mockNestedData[0]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockNestedData);
    });

    it('düz dizi şeklinde gelen yanıtı olduğu gibi dönmeli', () => {
      const mockFlatData = [
        { id: 1, uygulamaAdi: 'Proje 1' } as unknown as Project
      ];

      service.getProjects().subscribe(projects => {
        expect(projects.length).toBe(1);
        expect(projects).toEqual(mockFlatData);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockFlatData);
    });

    it('dizi olmayan geçersiz bir veri geldiğinde boş dizi dönmeli', () => {
      const invalidResponse = { message: 'Beklenmeyen nesne' };

      service.getProjects().subscribe(projects => {
        expect(projects).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(invalidResponse);
    });
  });

  describe('createProject', () => {
    it('yeni proje için POST isteği atmalı ve oluşturulan nesneyi dönmeli', () => {
      const newProject: Partial<Project> = { uygulamaAdi: 'Yeni Proje' };
      const createdProject = { id: 10, uygulamaAdi: 'Yeni Proje' } as unknown as Project;

      service.createProject(newProject).subscribe(res => {
        expect(res).toEqual(createdProject);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProject);
      req.flush(createdProject);
    });
  });

  describe('updateProject', () => {
    it('proje güncellemek için ilgili id ile PUT isteği atmalı', () => {
      const projectId = 5;
      const updatePayload: Partial<Project> = { uygulamaAdi: 'Güncel Proje Adı' };
      const updatedResponse = { id: 5, uygulamaAdi: 'Güncel Proje Adı' } as unknown as Project;

      service.updateProject(projectId, updatePayload).subscribe(res => {
        expect(res).toEqual(updatedResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}${projectId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatePayload);
      req.flush(updatedResponse);
    });
  });

  describe('deleteProject', () => {
    it('proje silmek için ilgili id ile DELETE isteği atmalı', () => {
      const projectId = 3;
      const deletedResponse = { id: 3 } as unknown as Project;

      service.deleteProject(projectId).subscribe(res => {
        expect(res).toEqual(deletedResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}${projectId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(deletedResponse);
    });
  });
});