export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleNameMapper: {
    '/opt/nodejs/(.*)': '<rootDir>/src/common/$1',
  },
  modulePathIgnorePatterns: ['.aws'],
  setupFiles: ['<rootDir>/__tests__/setupTests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts?$': 'esbuild-jest',
  },
}
