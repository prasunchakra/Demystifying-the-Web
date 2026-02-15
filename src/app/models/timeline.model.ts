export type EventCategory = 'global' | 'national' | 'regional';

export interface Evidence {
  type: 'youtube' | 'document' | 'image';
  url: string;
  title: string;
  thumbnailUrl?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: EventCategory;
  track: string;
  summary: string;
  description?: string;
  imageUrl?: string;
  evidence: Evidence[];
}

export interface TrackConfig {
  id: string;
  name: string;
  category: EventCategory;
  iconEmoji: string;
  accentHex: string;
}

export interface TimeRange {
  startYear: number;
  endYear: number;
}

export interface PositionedEvent {
  event: TimelineEvent;
  left: number;
  width: number;
  row: number;
}

export interface AxisTick {
  position: number;
  label: string;
  isMajor: boolean;
}
