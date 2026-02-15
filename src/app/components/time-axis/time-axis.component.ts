import { Component, input } from '@angular/core';
import { AxisTick } from '../../models/timeline.model';

@Component({
  selector: 'app-time-axis',
  standalone: true,
  templateUrl: './time-axis.component.html',
  styleUrl: './time-axis.component.css',
})
export class TimeAxisComponent {
  ticks = input.required<AxisTick[]>();
  totalWidth = input.required<number>();
}
