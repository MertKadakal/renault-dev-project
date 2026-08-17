import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:3000/api/projects/';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<Project[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => {
        if (Array.isArray(response) && Array.isArray(response[0])) {
          return response[0] as Project[];
        }

        if (Array.isArray(response)) {
          return response as Project[];
        }

        return [] as Project[];
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