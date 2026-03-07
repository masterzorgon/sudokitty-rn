import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesStoreProduct } from 'react-native-purchases';

import { useColors } from '../../theme/colors';
import { StoreItemRow } from '../ui/StoreItemRow';
import { usePlayerStreakStore } from '../../stores/playerStreakStore';
import { getMochiPackProducts, purchaseMochiPack } from '../../lib/revenueCat';
import {
  MOCHI_PACK_PRODUCT_IDS,
  MOCHI_PACK_AMOUNTS,
  type MochiPackProductId,
} from '../../constants/economy';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';
import {
  SelectionSheetLayout,
  selectionSheetStyles as ss,
  type SelectionSheetLayoutRef,
} from './SelectionSheetLayout';

export interface MochiPurchaseSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function MochiPurchaseSheet({ visible, onDismiss }: MochiPurchaseSheetProps) {
  const c = useColors();
  const totalMochis = usePlayerStreakStore((s) => s.totalMochiPoints);
  const layoutRef = useRef<SelectionSheetLayoutRef>(null);

  const [selectedPackId, setSelectedPackId] = useState<MochiPackProductId | null>(null);
  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedPackId(null);
      setProductsLoading(true);
      getMochiPackProducts().then((result) => {
        setProducts(result);
        setProductsLoading(false);
      });
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setSelectedPackId(null);
    onDismiss();
  }, [onDismiss]);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackId) return;
    const product = products.find((p) => p.identifier === selectedPackId);
    if (!product) return;

    setPurchasing(true);
    try {
      const result = await purchaseMochiPack(product);
      if (result.success && result.amount) {
        layoutRef.current?.close(() => {
          Alert.alert('Purchase Complete!', `You received ${result.amount!.toLocaleString()} mochis!`);
          handleDismiss();
        });
      }
    } catch {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [selectedPackId, products, handleDismiss]);

  const selectedAmount = selectedPackId ? MOCHI_PACK_AMOUNTS[selectedPackId] : null;
  const selectedProduct = selectedPackId ? products.find((p) => p.identifier === selectedPackId) : null;

  return (
    <SelectionSheetLayout
      ref={layoutRef}
      visible={visible}
      onDismiss={handleDismiss}
      pills={[{ icon: <MochiPointIcon width={19} height={19} />, label: `${totalMochis.toLocaleString()} mochis` }]}
      title="Purchase more mochis"
      buttonActive={!!selectedPackId}
      buttonLoading={purchasing}
      inactiveButtonLabel="Select Your Package"
      activeButtonContent={
        <View style={ss.buttonRow}>
          <Text style={ss.buttonText}>Purchase {selectedAmount?.toLocaleString()}</Text>
          <MochiPointIcon width={20} height={20} />
          <Text style={ss.buttonText}>mochis</Text>
          {selectedProduct && (
            <Text style={ss.buttonSeparator}>{'  ·  '}{selectedProduct.priceString}</Text>
          )}
        </View>
      }
      onButtonPress={handlePurchase}
    >
      {productsLoading ? (
        <ActivityIndicator size="small" color={c.accent} style={{ marginVertical: 24 }} />
      ) : (
        MOCHI_PACK_PRODUCT_IDS.map((packId) => {
          const amount = MOCHI_PACK_AMOUNTS[packId];
          const product = products.find((p) => p.identifier === packId);
          const isSelected = selectedPackId === packId;

          return (
            <StoreItemRow
              key={packId}
              icon={
                <View style={[ss.iconCircle, { backgroundColor: c.accentLight + '40' }]}>
                  <MochiPointIcon width={22} height={22} />
                </View>
              }
              title={`${amount.toLocaleString()} Mochis`}
              subtitle={product?.priceString ?? '—'}
              trailing={
                isSelected ? (
                  <Ionicons name="checkmark-circle" size={24} color={c.accent} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color={c.boxBorder} />
                )
              }
              onPress={() => setSelectedPackId(packId)}
            />
          );
        })
      )}
    </SelectionSheetLayout>
  );
}
