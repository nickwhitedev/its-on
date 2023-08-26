export default {
  transform: {
    '^.+\\.ts?$': 'esbuild-jest',
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  modulePathIgnorePatterns: ['.aws'],
  moduleNameMapper: {
    // Workaround for Jest not having ESM support yet
    // See: https://github.com/uuidjs/uuid/issues/451
    uuid: require.resolve('uuid'),
  },
}
