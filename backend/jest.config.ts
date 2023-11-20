export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleNameMapper: {
    '/opt/nodejs/(.*)': '<rootDir>/src/common/$1',
  },
  modulePathIgnorePatterns: ['.aws'],
  preset: 'ts-jest',
  resolver: 'ts-jest-resolver',
  setupFiles: ['<rootDir>/__tests__/setupTests.ts'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
}
