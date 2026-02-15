import {
  Component,
  inject,
  viewChild,
  ElementRef,
  computed,
  AfterViewInit,
} from '@angular/core';
import { TimelineDataService } from '../../services/timeline-data.service';
import { TimeAxisComponent } from '../time-axis/time-axis.component';
import { SwimlaneComponent } from '../swimlane/swimlane.component';

@Component({
  selector: 'app-timeline-container',
  standalone: true,
  imports: [TimeAxisComponent, SwimlaneComponent],
  templateUrl: './timeline-container.component.html',
  styleUrl: './timeline-container.component.css',
})
export class TimelineContainerComponent implements AfterViewInit {
  dataService = inject(TimelineDataService);
  viewport = viewChild.required<ElementRef<HTMLDivElement>>('viewport');

  readonly LABEL_WIDTH = 200;

  canvasWidth = computed(
    () => this.dataService.totalWidth() + this.LABEL_WIDTH + 80
  );
  ticks = computed(() => this.dataService.axisTicks());
  positionedEventsMap = computed(
    () => this.dataService.positionedEventsByTrack()
  );

  private scrollCenterTime = 0;

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      const el = this.viewport().nativeElement;
      const totalW = this.dataService.totalWidth();
      el.scrollLeft = (totalW - el.clientWidth + this.LABEL_WIDTH) / 2;
      this.trackScrollCenter();
    });
  }

  onScroll(): void {
    this.trackScrollCenter();
  }

  onWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.92 : 1.1;
      const newPpy = this.dataService.pixelsPerYear() * factor;
      this.handleZoom(newPpy);
    }
  }

  handleZoom(newPpy: number): void {
    const el = this.viewport().nativeElement;
    const oldPpy = this.dataService.pixelsPerYear();
    const scrollCenter =
      el.scrollLeft + el.clientWidth / 2 - this.LABEL_WIDTH;
    const centerTime = scrollCenter / oldPpy;

    this.dataService.setZoom(newPpy);

    requestAnimationFrame(() => {
      const actualPpy = this.dataService.pixelsPerYear();
      const newScrollCenter = centerTime * actualPpy;
      el.scrollLeft =
        newScrollCenter - el.clientWidth / 2 + this.LABEL_WIDTH;
    });
  }

  private trackScrollCenter(): void {
    const el = this.viewport().nativeElement;
    const ppy = this.dataService.pixelsPerYear();
    if (ppy > 0) {
      this.scrollCenterTime =
        (el.scrollLeft + el.clientWidth / 2 - this.LABEL_WIDTH) / ppy;
    }
  }
}
