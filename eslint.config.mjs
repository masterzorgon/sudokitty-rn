import expoConfig from "eslint-config-expo/flat.js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import globals from "globals";

export default [
  ...expoConfig,
  eslintConfigPrettier,
  {
    files: [
      "**/__tests__/**/*.js",
      "**/__tests__/**/*.jsx",
      "**/*.test.js",
      "**/*.test.jsx",
    ],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "dist/",
      "android/",
      "ios/",
      "coverage/",
      "supabase/functions/**",
    ],
  },
];
