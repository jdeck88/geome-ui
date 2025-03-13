import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, inject, OnDestroy, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MapQueryService } from '../../../../helpers/services/map-query.service';
import { NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit, OnDestroy{
  // injectors
  mapService = inject(MapQueryService);

  // Variable
  @Output() sidebarToggle:EventEmitter<boolean> = new EventEmitter();
  showSidebar:boolean = true;
  destroy$:Subject<any> = new Subject();
  mapId:string = '';
  currentTile:string = 'map';

  constructor(){
    this.mapId = `map-${parseInt(String(Math.random() * 100), 10)}`;
  }

  ngAfterViewInit(): void {
    this.mapService.mapInitialized.pipe(takeUntil(this.destroy$)).subscribe(()=> console.log('Map Initialized'))
    setTimeout(() => {
      this.mapService.initMap(this.mapId);
    }, 100);
  }

  toggleSidebar(t:NgbTooltip){
    t.close();
    this.showSidebar = !this.showSidebar;
    this.sidebarToggle.emit(this.showSidebar);
    setTimeout(() => {
      this.mapService.refreshSize();
    }, 100);
  }

  onViewChange(tile:string){
    if(this.currentTile == tile) return;
    this.currentTile = tile;
    if (tile === 'map') {
      this.mapService.switchToMapView();
    } else if (tile === 'sat') {
      this.mapService.switchToSatellite();
    } else if (tile === 'esri') {
      this.mapService.switchToOceanView();
    } 
  }

  ngOnDestroy(): void {
    this.destroy$.next('');
    this.destroy$.complete();
  }
}
