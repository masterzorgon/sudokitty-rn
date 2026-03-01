import React from 'react';
import { type ViewStyle } from 'react-native';
import { CTABannerCard } from './CTABannerCard';
import { PROMO_COPY, usePromoActions, type PromoKey } from './promoConfig';

interface CTABannerPromoCardProps {
  promoKey: PromoKey;
  style?: ViewStyle;
}

export function CTABannerPromoCard({ promoKey, style }: CTABannerPromoCardProps) {
  const actions = usePromoActions();
  const copy = PROMO_COPY[promoKey];

  return (
    <CTABannerCard
      badge={copy.badge}
      title={copy.title}
      buttonLabel={copy.buttonLabel}
      onPress={actions[promoKey]}
      accessibilityLabel={copy.accessibilityLabel}
      style={style}
    />
  );
}
