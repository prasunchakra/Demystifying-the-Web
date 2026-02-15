import { Injectable, computed, signal } from '@angular/core';
import {
  TimelineEvent,
  TrackConfig,
  TimeRange,
  PositionedEvent,
  AxisTick,
} from '../models/timeline.model';

@Injectable({ providedIn: 'root' })
export class TimelineDataService {
  // ── Constants ────────────────────────────────────────
  static readonly MIN_ZOOM = 30;
  static readonly MAX_ZOOM = 2000;
  static readonly MAX_LANES = 10;

  // ── Loading State ────────────────────────────────────
  readonly isLoading = signal(true);

  // ── Track Definitions (loaded from JSON) ─────────────
  readonly availableTracks = signal<TrackConfig[]>([]);

  // ── Active Track IDs (checked in header, up to 10) ───
  readonly activeTrackIds = signal<string[]>([]);

  // ── Ordered Lane IDs (preserves definition order) ────
  readonly laneTrackIds = computed(() => {
    const active = new Set(this.activeTrackIds());
    return this.availableTracks()
      .filter((t) => active.has(t.id))
      .map((t) => t.id);
  });

  // ── Zoom State ───────────────────────────────────────
  readonly pixelsPerYear = signal<number>(200);

  // ── Selected Event (for evidence panel) ──────────────
  readonly selectedEvent = signal<TimelineEvent | null>(null);

  // ── All Events (loaded from multiple JSON files) ─────
  readonly allEvents = signal<TimelineEvent[]>([]);

  // ── Derived: Active Tracks ───────────────────────────
  readonly activeTracks = computed(() => {
    const ids = this.laneTrackIds();
    const tracks = this.availableTracks();
    return ids
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is TrackConfig => !!t);
  });

  // ── Derived: Time Range ──────────────────────────────
  readonly timeRange = computed<TimeRange>(() => {
    const events = this.allEvents();
    if (events.length === 0) return { startYear: 1940, endYear: 1955 };

    let min = Infinity;
    let max = -Infinity;

    for (const e of events) {
      const d = new Date(e.date);
      const yf = d.getFullYear() + d.getMonth() / 12;
      min = Math.min(min, yf);
      if (e.endDate) {
        const ed = new Date(e.endDate);
        max = Math.max(max, ed.getFullYear() + ed.getMonth() / 12);
      } else {
        max = Math.max(max, yf);
      }
    }
    return {
      startYear: Math.floor(min) - 1,
      endYear: Math.ceil(max) + 2,
    };
  });

  // ── Derived: Total Pixel Width ───────────────────────
  readonly totalWidth = computed(
    () =>
      (this.timeRange().endYear - this.timeRange().startYear) *
      this.pixelsPerYear()
  );

  // ── Derived: Positioned Events Map ───────────────────
  readonly positionedEventsByTrack = computed(() => {
    const map = new Map<string, PositionedEvent[]>();
    for (const trackId of this.laneTrackIds()) {
      map.set(trackId, this.computePositionedEvents(trackId));
    }
    return map;
  });

  // ── Derived: Axis Ticks ──────────────────────────────
  readonly axisTicks = computed(() => this.computeAxisTicks());

  // ── Constructor: Load Data ───────────────────────────
  constructor() {
    this.loadData();
  }

  // ── Actions ──────────────────────────────────────────

  toggleTrack(trackId: string): void {
    const current = this.activeTrackIds();
    if (current.includes(trackId)) {
      // Don't allow removing the last track
      if (current.length > 1) {
        this.activeTrackIds.set(current.filter((id) => id !== trackId));
      }
    } else {
      if (current.length < TimelineDataService.MAX_LANES) {
        this.activeTrackIds.set([...current, trackId]);
      }
    }
  }

  eventsForTrack(trackId: string): TimelineEvent[] {
    return this.allEvents().filter((e) => e.track === trackId);
  }

  selectEvent(event: TimelineEvent | null): void {
    this.selectedEvent.set(event);
  }

  setZoom(value: number): void {
    this.pixelsPerYear.set(
      Math.max(
        TimelineDataService.MIN_ZOOM,
        Math.min(TimelineDataService.MAX_ZOOM, value)
      )
    );
  }

  // ── Data Loading ─────────────────────────────────────

  private async loadData(): Promise<void> {
    try {
      // 1. Load track definitions
      const tracksRes = await fetch('data/tracks.json');
      const tracks: TrackConfig[] = await tracksRes.json();
      this.availableTracks.set(tracks);

      // 2. Default: first 3 tracks active
      this.activeTrackIds.set(tracks.slice(0, 3).map((t) => t.id));

      // 3. Load all event files in parallel
      const eventPromises = tracks.map(async (track) => {
        const res = await fetch(`data/events/${track.id}.json`);
        return (await res.json()) as TimelineEvent[];
      });
      const eventArrays = await Promise.all(eventPromises);
      this.allEvents.set(eventArrays.flat());
    } catch (error) {
      console.error('Failed to load timeline data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Positioning & Collision ──────────────────────────

  computePositionedEvents(trackId: string): PositionedEvent[] {
    const events = this.eventsForTrack(trackId);
    const ppy = this.pixelsPerYear();
    const range = this.timeRange();
    const minCardWidth = 200;
    const cardPadding = 14;

    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const positioned: PositionedEvent[] = [];

    for (const event of sorted) {
      const left = this.dateToPixelRaw(event.date, range, ppy);
      let right: number;
      if (event.endDate) {
        right = this.dateToPixelRaw(event.endDate, range, ppy);
      } else {
        right = left;
      }

      const width = Math.max(minCardWidth, right - left);

      // Find first non-overlapping row
      let row = 0;
      const overlaps = (r: number) =>
        positioned.some(
          (p) =>
            p.row === r &&
            !(
              left + width + cardPadding <= p.left ||
              left >= p.left + p.width + cardPadding
            )
        );
      while (overlaps(row)) row++;

      positioned.push({ event, left, width, row });
    }

    return positioned;
  }

  // ── Axis Ticks ───────────────────────────────────────

  computeAxisTicks(): AxisTick[] {
    const ppy = this.pixelsPerYear();
    const range = this.timeRange();
    const ticks: AxisTick[] = [];

    if (ppy >= 400) {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      for (
        let y = Math.floor(range.startYear);
        y <= Math.ceil(range.endYear);
        y++
      ) {
        for (let m = 0; m < 12; m++) {
          const frac = y + m / 12;
          if (frac >= range.startYear && frac <= range.endYear) {
            const px = (frac - range.startYear) * ppy;
            ticks.push({
              position: px,
              label: m === 0 ? `${y}` : monthNames[m],
              isMajor: m === 0,
            });
          }
        }
      }
    } else if (ppy >= 100) {
      for (
        let y = Math.floor(range.startYear);
        y <= Math.ceil(range.endYear);
        y++
      ) {
        const px = (y - range.startYear) * ppy;
        ticks.push({ position: px, label: `${y}`, isMajor: true });
        if (ppy >= 200) {
          const halfPx = (y + 0.5 - range.startYear) * ppy;
          if (y + 0.5 <= range.endYear) {
            ticks.push({ position: halfPx, label: '', isMajor: false });
          }
        }
      }
    } else {
      const startDecade = Math.floor(range.startYear / 10) * 10;
      for (let d = startDecade; d <= range.endYear; d += 10) {
        if (d >= range.startYear) {
          const px = (d - range.startYear) * ppy;
          ticks.push({ position: px, label: `${d}`, isMajor: true });
        }
        if (d + 5 >= range.startYear && d + 5 <= range.endYear) {
          const halfPx = (d + 5 - range.startYear) * ppy;
          ticks.push({
            position: halfPx,
            label: `${d + 5}`,
            isMajor: false,
          });
        }
      }
    }

    return ticks;
  }

  // ── Private Helpers ──────────────────────────────────

  private dateToPixelRaw(
    dateStr: string,
    range: TimeRange,
    ppy: number
  ): number {
    const d = new Date(dateStr);
    const yearFrac =
      d.getFullYear() + d.getMonth() / 12 + d.getDate() / 365;
    return (yearFrac - range.startYear) * ppy;
  }
}
