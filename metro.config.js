// Metro configuration for react-native-svg-transformer
// Allows importing SVG files as React components

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add svg to asset extensions (remove from source extensions)
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Use svg transformer for .svg files
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = config;
