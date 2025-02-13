import { Component, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, Subject, take } from 'rxjs';
import { ProjectConfigurationService } from '../../../../helpers/services/project-config.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTooltipModule],
  templateUrl: './teams-list.component.html',
  styleUrl: './teams-list.component.scss'
})
export class TeamsListComponent {
  // Injectors
  toastr = inject(ToastrService);
  projectConfService = inject(ProjectConfigurationService);

  // Variables
  isLoading: boolean = false;
  searchedTeam: string = '';
  filterTeamSubject: Subject<any> = new Subject();
  allPublicTeams: Array<any> = [];
  filteredPublicTeams: Array<any> = [];

  constructor() {
    this.getAllPublicTeams();
    this.filterTeamSubject.pipe(debounceTime(100)).subscribe(() => this.filterTeam())
  }

  getAllPublicTeams() {
    this.isLoading = true;
    this.projectConfService.allProjConfigSubject.subscribe((res:any)=>{
      if(res){
        const allTeams:[] = res.filter((team:any)=> team.networkApproved);
        allTeams.forEach((team:any, i:number)=> this.getTeamModules(team.id));
        this.isLoading = false;
      }
    })
  }

  getTeamModules(id:number){
    this.projectConfService.get(id).pipe(take(1)).subscribe({
      next: (res:any)=>{
        console.log('====',res);
        this.allPublicTeams.push(res);
        this.filteredPublicTeams = this.allPublicTeams;
      },
      error: (err:any)=>{
        this.toastr.error(err.error.usrmessage);
      }
    })
  }

  filterTeam() {
    const newVal = this.searchedTeam.trim().toLowerCase();
    if (newVal)
      this.filteredPublicTeams = this.allPublicTeams.filter((proj: any) => proj.name.toLowerCase().includes(newVal));
    else this.filteredPublicTeams = this.allPublicTeams;
  }
}
