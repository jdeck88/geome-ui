import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of } from 'rxjs';
// import { ProjectConfigurationService } from './project-configuration.service';
// import { ProjectConfige } from '../models/ProjectConfig';
import { environment } from '../../environments/environment';
import { AuthenticationService } from './authentication.service';

export const PROJECT_CHANGED_EVENT = 'projectChanged';

export interface Project {
  projectId: string;
  config?: any;
  limitedAccess?: boolean;
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = environment.restRoot;
  private currentProject: Project | null = null;
  private projectSubject = new BehaviorSubject<Project | null>(null);
  private allProjectSubject = new BehaviorSubject<Project[] | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthenticationService,
  ) {
    this.loadAllProjects();
  }

  get currentProject$(): Observable<Project | null> {
    return this.projectSubject.asObservable();
  }

  getAllProjectsValue():Observable<any>{
    return this.allProjectSubject.asObservable();
  }

  setCurrentProject(projectID: any, redirectIfNull = true): void {
    if (!projectID) {
      this.currentProject = null;
      this.projectSubject.next(null);
      if (redirectIfNull) {
        this.router.navigate(['/workbench/dashboard']);
      }
      return;
    }
    this.cacheProject(projectID);
  }

  cacheProject(projectId: string): void {
    this.authService.apendUserVal('projectId', projectId);
  }

  getProject(projectId: string, includeConfig = true): Observable<Project | null> {
    if (!projectId) {
      return of(null);
    }

    return this.getAllProjects(true).pipe(
      map((projects) => projects.find((p) => p.projectId === projectId) || null),
      catchError(() => of(null))
    );
  }

  getProjectConfig(projectId: string): Observable<any | null> {
    if (!projectId) {
      return of(null);
     }
    return this.http
      .get<any>(`${this.apiUrl}projects/${projectId}/config`)
      .pipe(catchError(() => of(null)));
  }

  getAllProjects(includePublic: boolean): Observable<Project[]> {
    return this.http
      .get<Project[]>(`${this.apiUrl}projects?includePublic=${includePublic}`)
      .pipe(catchError(() => of([])));
  }

  loadAllProjects(){
    this.getAllProjects(true).subscribe((res:any) => this.allProjectSubject.next(res))
  }

  findProject(includePublic: boolean, projectTitle: string): Observable<Project[]> {
    return this.http
      .get<Project[]>(`${this.apiUrl}projects?includePublic=${includePublic}&projectTitle=${projectTitle}`)
      .pipe(catchError(() => of([])));
  }

  checkExists(projectTitle: string): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.apiUrl}projects/exists/${projectTitle}`)
      .pipe(catchError(() => of(false)));
  }

  getProjectStats(includePublic: boolean): Observable<any> {
    return this.http
      .get(`${this.apiUrl}projects/stats?includePublic=${includePublic}`)
      .pipe(catchError(() => of(null)));
  }

  createProject(project: Project): Observable<Project> {
    return this.http
      .post<Project>(`${this.apiUrl}projects`, project)
      .pipe(catchError(() => of(null as any)));
  }

  updateProject(project: Project): Observable<Project> {
    return this.http
      .put<Project>(`${this.apiUrl}projects/${project.projectId}`, project)
      .pipe(catchError(() => of(null as any)));
  }

  deleteProject(project: Project): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}projects/${project.projectId}`).pipe(
      map(() => {
        this.setCurrentProject(null);
      }),
      catchError(() => of())
    );
  }

  loadFromSession(){
    const storedData = this.authService.getUserFromStorage;
    const userVal = storedData ? JSON.parse(storedData) : undefined;
    const projectId = userVal?.projectId || null;
    if(projectId) this.setCurrentProject(projectId);
  } 
}
