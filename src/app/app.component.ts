import { Component, inject, computed, viewChild, signal, HostListener } from '@angular/core';
import { TimelineDataService } from './services/timeline-data.service';
import { TimelineContainerComponent } from './components/timeline-container/timeline-container.component';
import { EvidencePanelComponent } from './components/evidence-panel/evidence-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TimelineContainerComponent, EvidencePanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  dataService = inject(TimelineDataService);
  timelineContainer = viewChild(TimelineContainerComponent);

  readonly MIN_ZOOM = TimelineDataService.MIN_ZOOM;
  readonly MAX_ZOOM = TimelineDataService.MAX_ZOOM;
  readonly MAX_LANES = TimelineDataService.MAX_LANES;

  /** Dropdown open state */
  trackDropdownOpen = signal(false);

  activeCount = computed(() => this.dataService.activeTrackIds().length);
  totalCount = computed(() => this.dataService.availableTracks().length);

  zoomLabel = computed(() => {
    const ppy = this.dataService.pixelsPerYear();
    if (ppy < 50) return 'Decades';
    if (ppy < 150) return 'Years';
    if (ppy < 400) return 'Months';
    return 'Weeks';
  });

  toggleDropdown(): void {
    this.trackDropdownOpen.update((v) => !v);
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.track-dropdown')) {
      this.trackDropdownOpen.set(false);
    }
  }

  onZoomChange(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    const container = this.timelineContainer();
    if (container) {
      container.handleZoom(value);
    }
  }
}
