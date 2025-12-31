module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: ['babel-preset-expo'],
    plugins: isTest
      ? []
      : [
          // Required for react-native-gesture-handler
          // Disabled in test environment to avoid worklets plugin dependency
          'react-native-reanimated/plugin',
        ],
  };
};
