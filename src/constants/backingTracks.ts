import { MOCHIS_COST } from './economy';

export interface BackingTrackDef {
  id: string;
  name: string;
  cost: number;
  asset: number;
  demoDurationMs: number;
}

const DEFAULT_DEMO_MS = 8000;

export const BACKING_TRACKS: BackingTrackDef[] = [
  { id: 'default', name: 'Calm Default', cost: 0, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_2', name: 'Lo-Fi Beats', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_3', name: 'Piano Focus', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_4', name: 'Rainy Day', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_5', name: 'Jazz Café', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_6', name: 'Ocean Waves', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_7', name: 'Forest Ambience', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_8', name: 'Chiptune Chill', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_9', name: 'Acoustic Garden', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_10', name: 'Night Sky', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/game-background.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
];

export function getTrackById(id: string): BackingTrackDef | undefined {
  return BACKING_TRACKS.find((t) => t.id === id);
}
