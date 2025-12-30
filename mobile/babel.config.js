module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // NativeWind v4 requires additional metro config - disabled for now
    // plugins: ['nativewind/babel'],
  };
};
