import { TextStyle } from "react-native";

export const fontFamilies = {
  regular: "Pally-Regular",
  medium: "Pally-Medium",
  semibold: "Pally-Bold", // Pally has no Semibold; use Bold as closest match
  bold: "Pally-Bold",
};

export const fontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  caption: 14,
  body: 16,
  headline: 18,
  title: 24,
  largeTitle: 32,
  cell: 24, // Slightly larger for better presence
  notes: 10,
};

export const typography: Record<string, TextStyle> = {
  largeTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.largeTitle,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.title,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.headline,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.body,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.body,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.caption,
  },
  captionLight: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.caption,
  },
  small: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
  },
  cellValue: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.cell,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  cellNotes: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.notes,
    textAlign: "center",
  },
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.body,
    textAlign: "center",
  },
  buttonSmall: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.caption,
    textAlign: "center",
  },
};
