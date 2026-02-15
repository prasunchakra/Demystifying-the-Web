import { Component, computed, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';
import { TimelineDataService } from '../../services/timeline-data.service';
import { SafePipe } from '../../pipes/safe.pipe';
import { EventCategory } from '../../models/timeline.model';

@Component({
  selector: 'app-evidence-panel',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, SafePipe],
  templateUrl: './evidence-panel.component.html',
  styleUrl: './evidence-panel.component.css',
  animations: [
    trigger('slidePanel', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate(
          '400ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms cubic-bezier(0.7, 0, 0.84, 0)',
          style({ transform: 'translateX(100%)' })
        ),
      ]),
    ]),
    trigger('fadeBackdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class EvidencePanelComponent {
  private dataService = inject(TimelineDataService);
  event = computed(() => this.dataService.selectedEvent());

  close(): void {
    this.dataService.selectEvent(null);
  }

  getCategoryColor(category: EventCategory): string {
    switch (category) {
      case 'global':
        return '#7c3aed';
      case 'national':
        return '#10b981';
      case 'regional':
        return '#f59e0b';
    }
  }
}
