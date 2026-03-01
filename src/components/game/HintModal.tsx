// Hint explanation modal - bottom sheet that shows technique name + explanation
// Appears when a strategic hint fills a cell; dismissed via "Apply Hint" button

import React from 'react';

import { useLastHint, useGameStore } from '../../stores/gameStore';
import { BottomSheet } from '../ui/Sheet/BottomSheet';

export function HintModal() {
  const lastHint = useLastHint();
  const dismissHintModal = useGameStore((s) => s.dismissHintModal);

  return (
    <BottomSheet
      visible={lastHint !== null}
      onDismiss={dismissHintModal}
      title={lastHint?.techniqueName ?? ''}
      description={lastHint?.explanation ?? ''}
      action={{ label: 'Apply Hint', onPress: dismissHintModal }}
      blurBackground={false}
    />
  );
}
