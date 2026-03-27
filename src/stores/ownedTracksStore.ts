import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKING_TRACKS, getTrackById } from '../constants/backingTracks';
import { usePlayerStreakStore } from './playerStreakStore';

interface OwnedTracksState {
  ownedTrackIds: string[];
  activeTrackId: string;
}

interface OwnedTracksActions {
  addOwnedTrack: (id: string) => void;
  setActiveTrack: (id: string) => void;
  isOwned: (id: string) => boolean;
  buyTrack: (trackId: string) => boolean;
}

export const useOwnedTracksStore = create<OwnedTracksState & OwnedTracksActions>()(
  persist(
    (set, get) => ({
      ownedTrackIds: ['default'],
      activeTrackId: 'default',

      addOwnedTrack: (id: string) => {
        const { ownedTrackIds } = get();
        if (ownedTrackIds.includes(id)) return;
        set({ ownedTrackIds: [...ownedTrackIds, id] });
      },

      setActiveTrack: (id: string) => {
        if (!get().ownedTrackIds.includes(id)) return;
        set({ activeTrackId: id });
      },

      isOwned: (id: string) => {
        return get().ownedTrackIds.includes(id);
      },

      buyTrack: (trackId: string): boolean => {
        const track = getTrackById(trackId);
        if (!track) return false;

        if (track.cost === 0 || get().isOwned(trackId)) return false;

        const spent = usePlayerStreakStore.getState().spendMochis(track.cost, 'backing_track');
        if (!spent) return false;

        get().addOwnedTrack(trackId);
        get().setActiveTrack(trackId);
        return true;
      },
    }),
    {
      name: '@sudokitty/owned_tracks',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: OwnedTracksState) => {
        const validIds = new Set(BACKING_TRACKS.map((t) => t.id));
        let ownedTrackIds = (persistedState?.ownedTrackIds ?? []).filter((id) => validIds.has(id));
        if (ownedTrackIds.length === 0) ownedTrackIds = ['default'];
        let activeTrackId = persistedState?.activeTrackId ?? 'default';
        if (!validIds.has(activeTrackId)) activeTrackId = 'default';
        if (!ownedTrackIds.includes(activeTrackId)) activeTrackId = 'default';
        return { ...persistedState, ownedTrackIds, activeTrackId };
      },
    },
  ),
);

export const useActiveTrackId = () => useOwnedTracksStore((s) => s.activeTrackId);
export const useOwnedTrackIds = () => useOwnedTracksStore((s) => s.ownedTrackIds);
