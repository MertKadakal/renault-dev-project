import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Project } from '../models/project';

// Component'te veriyi ve toplam sayıyı rahatça kullanabilmek için bir interface oluşturuyoruz
export interface PaginatedProjects {
  data: Project[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly apiUrl = 'http://localhost:3000/api/projects/';

  constructor(private readonly http: HttpClient) { }

  // Varsayılan olarak page=1 ve limit=10 verdik. İstediğin gibi değiştirebilirsin.
  getProjects(page: number = 1, limit: number = 10): Observable<PaginatedProjects> {
    // Backend'deki skip/take mantığına göre hesaplama yapıyoruz
    const skip = (page - 1) * limit;

    // HTTP parametrelerini ayarlıyoruz
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('take', limit.toString());
    
    // Not: NestJS controller'ın query'den skip ve take aldığını varsayıyorum.
    // Eğer controller tarafında doğrudan page ve limit alıyorsan, params.set('page', page) şeklinde revize edebilirsin.

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Backend'deki findAndCount bize [Project[], number] döndüğü için:
        if (Array.isArray(response) && Array.isArray(response[0])) {
          return {
            data: response[0] as Project[],
            total: response[1] as number // İkinci eleman toplam kayıt sayısıdır
          };
        }

        // Beklenmeyen bir yanıt gelirse patlamaması için fallback
        if (Array.isArray(response)) {
          return {
            data: response as Project[],
            total: response.length
          };
        }

        return { data: [], total: 0 };
      })
    );
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}${id}`, project);
  }

  deleteProject(id: number): Observable<Project> {
    return this.http.delete<Project>(`${this.apiUrl}${id}`);
  }
}