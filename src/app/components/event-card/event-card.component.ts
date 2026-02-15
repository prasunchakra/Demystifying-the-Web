import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TimelineEvent } from '../../models/timeline.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
})
export class EventCardComponent {
  event = input.required<TimelineEvent>();
  accentHex = input.required<string>();
  clicked = output<void>();
}
