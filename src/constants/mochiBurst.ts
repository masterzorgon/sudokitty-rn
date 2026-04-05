/** Must match [MochiBurstOverlay](src/components/fx/MochiBurstOverlay.tsx) particle budget. */
export function PARTICLE_COUNT(amount: number): number {
  return Math.max(1, Math.round(Math.min(Math.max(Math.floor(amount / 25), 12), 40) * 0.6));
}
