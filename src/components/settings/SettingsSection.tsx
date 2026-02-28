import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing, borderRadius } from '../../theme';
import { SkeuCard } from '../ui/Skeuomorphic';
import { SectionTitle } from '../ui/SectionTitle';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.container}>
      <SectionTitle variant="caption">{title}</SectionTitle>
      <SkeuCard borderRadius={borderRadius.lg}>
        {children}
      </SkeuCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
});
