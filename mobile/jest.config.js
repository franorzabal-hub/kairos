/**
 * Jest configuration for Kairos mobile app
 *
 * Uses ts-jest for TypeScript support without babel-preset-expo
 * to avoid react-native-reanimated/worklets plugin issues.
 *
 * For component tests that need React Native, we'll need a separate config.
 */
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Use ts-jest for TypeScript files - avoids babel-preset-expo issues
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      // Don't type-check in tests for speed
      isolatedModules: true,
    }],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // Handle module aliases if needed
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  // Clear mocks between tests
  clearMocks: true,
  // Faster test execution
  maxWorkers: '50%',
};
