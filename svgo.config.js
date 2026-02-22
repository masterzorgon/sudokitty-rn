// SVGO Configuration for Safe SVG Optimization
// This configuration focuses on removing unnecessary data while preserving visual appearance

module.exports = {
  multipass: true, // Run optimizations multiple times for better results
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // CRITICAL: Keep viewBox attribute (required for React Native SVG scaling)
          removeViewBox: false,
          // Don't remove or clean up IDs (they might be referenced)
          cleanupIds: false,
          // Don't merge paths (can change appearance in complex SVGs)
          mergePaths: false,
          // Don't convert shapes to paths (preserves semantic meaning)
          convertShapeToPath: false,
          // Round numbers to 3 decimal places (good balance)
          cleanupNumericValues: {
            floatPrecision: 3
          }
        }
      }
    }
  ]
};
