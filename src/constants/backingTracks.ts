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
  { id: 'default', name: 'Mochi Morning', cost: 0, asset: require('../../assets/audio/tracks/mochi-morning.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_2', name: 'Sakura Pop', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/sakura-pop.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_3', name: 'Pixel Parade', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/pixel-parade.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_4', name: 'Cloud Nap', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/cloud-nap.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_5', name: 'Boba Rush', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/boba-rush.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_6', name: 'Tanuki Shuffle', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/tanuki-shuffle.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_7', name: 'Starlight Study', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/starlight-study.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_8', name: 'Rainy Cafe', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/rainy-cafe.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_9', name: 'Hanami Festival', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/hanami-festival.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_10', name: 'Pastel Rave', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/pastel-rave.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_11', name: 'Cottagecore Cat', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/cottagecore-cat.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_12', name: 'Midnight Mochi', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/midnight-mochi.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_13', name: 'Neon Harajuku', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/neon-harajuku.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
  { id: 'track_14', name: 'Zen Garden', cost: MOCHIS_COST.backing_track, asset: require('../../assets/audio/tracks/zen-garden.m4a'), demoDurationMs: DEFAULT_DEMO_MS },
];

export function getTrackById(id: string): BackingTrackDef | undefined {
  return BACKING_TRACKS.find((t) => t.id === id);
}
