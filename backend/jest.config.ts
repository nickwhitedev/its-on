export default {
  transform: {
    '^.+\\.ts?$': 'esbuild-jest',
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  modulePathIgnorePatterns: ['.aws'],
  setupFiles: ['<rootDir>/__tests__/setupTests.ts'],
}
