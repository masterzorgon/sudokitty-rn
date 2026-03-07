import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '../../theme/colors';
import { StoreItemRow } from '../ui/StoreItemRow';
import { usePlayerStreakStore } from '../../stores/playerStreakStore';
import { MOCHIS_COST, MOCHI_PACK_AMOUNTS } from '../../constants/economy';
import { getMochiPackProducts, purchaseMochiPack } from '../../lib/revenueCat';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';
import {
  SelectionSheetLayout,
  selectionSheetStyles as ss,
  type SelectionSheetLayoutRef,
} from './SelectionSheetLayout';

const FREEZE_OPTIONS = [
  { qty: 1, label: '1 Streak Freeze' },
  { qty: 2, label: '2 Streak Freezes' },
  { qty: 3, label: '3 Streak Freezes' },
] as const;

export interface StreakFreezePurchaseSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function StreakFreezePurchaseSheet({ visible, onDismiss }: StreakFreezePurchaseSheetProps) {
  const c = useColors();
  const totalMochis = usePlayerStreakStore((s) => s.totalMochiPoints);
  const freezeCount = usePlayerStreakStore((s) => s.streakFreezesCount ?? 0);
  const buyStreakFreeze = usePlayerStreakStore((s) => s.buyStreakFreeze);
  const layoutRef = useRef<SelectionSheetLayoutRef>(null);

  const [selectedQty, setSelectedQty] = useState<number | null>(null);

  const selectedCost = selectedQty ? selectedQty * MOCHIS_COST.streak_freeze : null;
  const canAfford = selectedCost !== null && totalMochis >= selectedCost;
  const showInsufficientFunds = selectedQty !== null && !canAfford;

  const suggestedPackAmount = (() => {
    if (!showInsufficientFunds || !selectedCost) return null;
    const deficit = selectedCost - totalMochis;
    const sorted = Object.values(MOCHI_PACK_AMOUNTS).sort((a, b) => a - b);
    return sorted.find((amount) => amount >= deficit) ?? sorted[sorted.length - 1];
  })();

  const handleDismiss = useCallback(() => {
    setSelectedQty(null);
    onDismiss();
  }, [onDismiss]);

  const handlePurchase = useCallback(() => {
    if (!selectedQty) return;

    let purchased = 0;
    for (let i = 0; i < selectedQty; i++) {
      if (buyStreakFreeze()) purchased++;
    }

    if (purchased > 0) {
      layoutRef.current?.close(() => {
        Alert.alert(
          'Streak Freeze Purchased!',
          purchased === 1
            ? 'Your streak is protected for one missed day.'
            : `${purchased} streak freezes added. You're protected for ${purchased} missed days.`,
        );
        handleDismiss();
      });
    }
  }, [selectedQty, buyStreakFreeze, handleDismiss]);

  const handleInsufficientFunds = useCallback(async () => {
    if (!selectedCost) return;
    const deficit = selectedCost - totalMochis;
    const sortedAmounts = Object.entries(MOCHI_PACK_AMOUNTS)
      .sort(([, a], [, b]) => a - b);

    const targetPack = sortedAmounts.find(([, amount]) => amount >= deficit);
    const packId = targetPack ? targetPack[0] : sortedAmounts[sortedAmounts.length - 1][0];

    const products = await getMochiPackProducts();
    const product = products.find((p) => p.identifier === packId);
    if (!product) {
      Alert.alert('Unavailable', 'Mochi packs are currently unavailable. Please try again later.');
      return;
    }
    const result = await purchaseMochiPack(product);
    if (result.success && result.amount) {
      Alert.alert('Purchase Complete!', `You received ${result.amount.toLocaleString()} mochis!`);
    }
  }, [selectedCost, totalMochis]);

  return (
    <SelectionSheetLayout
      ref={layoutRef}
      visible={visible}
      onDismiss={handleDismiss}
      pills={[
        { icon: <MochiPointIcon width={19} height={19} />, label: totalMochis.toLocaleString() },
        { icon: <Ionicons name="snow" size={17} color="#42A5F5" />, label: String(freezeCount) },
      ]}
      title="Buy Streak Freezes"
      subtitle="Each freeze protects your streak for one missed day"
      buttonActive={!!(selectedQty && canAfford)}
      insufficientFunds={showInsufficientFunds}
      insufficientFundsButtonContent={
        <View style={ss.buttonRow}>
          <Text style={ss.buttonText}>Not enough mochis. Get {suggestedPackAmount?.toLocaleString()}</Text>
          <MochiPointIcon width={18} height={18} />
          <Text style={ss.buttonText}>mochis</Text>
        </View>
      }
      onInsufficientFundsPress={handleInsufficientFunds}
      inactiveButtonLabel="Select a Quantity"
      activeButtonContent={
        <View style={ss.buttonRow}>
          <Text style={ss.buttonText}>
            Buy {selectedQty} freeze{selectedQty === 1 ? '' : 's'}
          </Text>
          <Text style={ss.buttonSeparator}>·</Text>
          <Text style={ss.buttonText}>{selectedCost?.toLocaleString()}</Text>
          <MochiPointIcon width={18} height={18} />
        </View>
      }
      onButtonPress={handlePurchase}
    >
      {FREEZE_OPTIONS.map(({ qty, label }) => {
        const cost = qty * MOCHIS_COST.streak_freeze;
        const isSelected = selectedQty === qty;
        const affordable = totalMochis >= cost;

        return (
          <StoreItemRow
            key={qty}
            icon={
              <View style={[ss.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="snow" size={22} color="#42A5F5" />
              </View>
            }
            title={label}
            subtitle={
              affordable
                ? `${cost.toLocaleString()} mochis`
                : `${cost.toLocaleString()} mochis · Need ${(cost - totalMochis).toLocaleString()} more`
            }
            trailing={
              isSelected ? (
                <Ionicons name="checkmark-circle" size={24} color={c.accent} />
              ) : (
                <Ionicons name="ellipse-outline" size={24} color={c.boxBorder} />
              )
            }
            onPress={() => setSelectedQty(qty)}
          />
        );
      })}
    </SelectionSheetLayout>
  );
}
