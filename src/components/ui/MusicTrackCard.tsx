import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, useColors } from "../../theme/colors";
import { DemoPlayButton } from "./DemoPlayButton";
import { StoreItemRow } from "./StoreItemRow";
import { MochiPricePill } from "./MochiPricePill";
import { borderRadius } from "../../theme";
import type { BackingTrackDef } from "../../constants/backingTracks";

const ICON_SIZE = 48;

export interface MusicTrackCardProps {
  track: BackingTrackDef;
  isOwned?: boolean;
  isActive: boolean;
  /** When set (e.g. store preview), shows interactive play; otherwise static music icon. */
  isDemoPlaying?: boolean;
  onToggleDemo?: () => void;
  disabled?: boolean;
  /** True while deck rank animation runs — blocks tap without changing visuals */
  selectionLocked?: boolean;
  onSelect: () => void;
}

export function MusicTrackCard({
  track,
  isOwned = true,
  isActive,
  isDemoPlaying = false,
  onToggleDemo,
  disabled = false,
  selectionLocked = false,
  onSelect,
}: MusicTrackCardProps) {
  const c = useColors();
  const mutedColor = colors.textLight;
  const trailingColor = disabled ? mutedColor : isActive ? c.accent : c.boxBorder;

  const useStaticMusicIcon = onToggleDemo == null;

  const iconBg = isActive ? c.accentLight + "40" : colors.textLight + "35";
  const iconColor = isActive ? c.accent : mutedColor;

  const icon = useStaticMusicIcon ? (
    <View
      style={[
        styles.musicIconSquare,
        { backgroundColor: iconBg },
        !isActive && styles.musicIconSquareMuted,
      ]}
      pointerEvents="none"
    >
      <Ionicons name="musical-notes" size={ICON_SIZE * 0.45} color={iconColor} />
    </View>
  ) : (
    <DemoPlayButton
      isPlaying={isDemoPlaying}
      durationMs={track.demoDurationMs}
      onPress={onToggleDemo!}
      size={ICON_SIZE}
      color={disabled ? mutedColor : undefined}
    />
  );

  const subtitle = isOwned
    ? isActive
      ? "This song is actively selected"
      : "Select this song to play it"
    : undefined;

  const trailing = !isOwned ? (
    <MochiPricePill price={track.cost} />
  ) : isActive ? (
    <Ionicons name="checkmark-circle" size={24} color={trailingColor} />
  ) : (
    <Ionicons name="ellipse-outline" size={24} color={trailingColor} />
  );

  return (
    <StoreItemRow
      icon={icon}
      title={track.name}
      subtitle={subtitle}
      trailing={trailing}
      onPress={selectionLocked ? undefined : onSelect}
    />
  );
}

const styles = StyleSheet.create({
  musicIconSquare: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  musicIconSquareMuted: {
    opacity: 0.85,
  },
});
