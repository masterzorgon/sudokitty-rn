import { Share } from "react-native";
import { Asset } from "expo-asset";

import type { Difficulty } from "../engine/types";
import { DIFFICULTY_CONFIG } from "../engine/types";

export const SHARE_MESSAGE = "Check out SudoKitty — an app that helps you master sudoku!";

/** iOS App Store URL — replace idXXXXXXXXX with your app’s Apple ID from App Store Connect */
export const IOS_APP_STORE_URL = "https://apps.apple.com/app/sudokitty/idXXXXXXXXX";

/** Promotional victory graphic (Sudokitty branding + celebratory art) for the iOS share sheet. */
export const VICTORY_SHARE_IMAGE = require("../../assets/images/share/victory-share.png");

export function buildVictoryShareMessage(difficulty: Difficulty, isDaily: boolean): string {
  const name = DIFFICULTY_CONFIG[difficulty].name;
  const victoryLine = isDaily
    ? `I just solved today's Daily Sudoku (${name}) in Sudokitty!`
    : `I just solved a ${name} Sudoku in Sudokitty!`;
  return `${victoryLine}\n\n${SHARE_MESSAGE}\n${IOS_APP_STORE_URL}`;
}

/**
 * iOS: shares message + App Store link, with bundled victory graphic when asset URI is available.
 */
export async function shareVictoryOutcome(difficulty: Difficulty, isDaily: boolean): Promise<void> {
  const message = buildVictoryShareMessage(difficulty, isDaily);
  try {
    const asset = Asset.fromModule(VICTORY_SHARE_IMAGE);
    await asset.downloadAsync();
    const uri = asset.localUri;
    if (uri) {
      await Share.share({
        message,
        url: uri,
        title: "Sudokitty",
      });
    } else {
      await Share.share({
        message,
        url: IOS_APP_STORE_URL,
        title: "Sudokitty",
      });
    }
  } catch {
    /* user cancelled or share failed */
  }
}
