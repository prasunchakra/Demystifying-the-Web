import { Component, input, output, computed } from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';
import {
  TimelineEvent,
  PositionedEvent,
} from '../../models/timeline.model';
import { EventCardComponent } from '../event-card/event-card.component';

@Component({
  selector: 'app-swimlane',
  standalone: true,
  imports: [EventCardComponent],
  templateUrl: './swimlane.component.html',
  styleUrl: './swimlane.component.css',
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.88) translateY(12px)' }),
        animate(
          '450ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class SwimlaneComponent {
  positionedEvents = input.required<PositionedEvent[]>();
  accentHex = input.required<string>();
  totalWidth = input.required<number>();
  eventClicked = output<TimelineEvent>();

  readonly ROW_HEIGHT = 130;

  laneHeight = computed(() => {
    const events = this.positionedEvents();
    if (events.length === 0) return this.ROW_HEIGHT + 20;
    const maxRow = Math.max(...events.map((p) => p.row));
    return (maxRow + 1) * this.ROW_HEIGHT + 24;
  });
}
