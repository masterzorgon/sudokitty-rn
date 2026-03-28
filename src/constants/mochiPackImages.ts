import type { ImageSourcePropType } from 'react-native';

import type { MochiPackProductId } from './economy';

/** Bundled preview art per IAP tier (store list + purchase sheet). */
export const MOCHI_PACK_IMAGE_SOURCES: Record<MochiPackProductId, ImageSourcePropType> = {
  mochis_500: require('../../assets/images/mochi/mochi-pack-500.png'),
  mochis_1200: require('../../assets/images/mochi/mochi-pack-1200.png'),
  mochis_3000: require('../../assets/images/mochi/mochi-pack-3000.png'),
};

const HERO_BASE = 200;
/** 500-tier art vs other packs (cumulative: ~36% smaller than 1200/3000). */
const PACK_500_SCALE = 0.64;

/** Hero image size in store purchase sheet for IAP mochi packs. */
export function getMochiPackHeroSize(packId: MochiPackProductId): number {
  return packId === 'mochis_500'
    ? Math.round(HERO_BASE * PACK_500_SCALE)
    : HERO_BASE;
}
