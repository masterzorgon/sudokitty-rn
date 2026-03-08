import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';

export function MochiPricePill({ price }: { price: number }) {
  const c = useColors();
  return (
    <View style={styles.pill}>
      <MochiPointIcon width={21} height={21} />
      <Text style={[styles.text, { color: c.textPrimary }]}>{price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
  },
});
