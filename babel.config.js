module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/lib': './lib',
            '@/components': './components',
            '@/assets': './assets',
          },
        },
      ],
      // React Native Reanimated plugin (must be last)
      'react-native-worklets/plugin',
    ],
  };
};
