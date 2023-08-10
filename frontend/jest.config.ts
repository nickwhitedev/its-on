/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  automock: false,
  moduleNameMapper: {
    '^.+\\.(css|less|svg)$': '<rootDir>/jest-config/CSSStub.ts',
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: ['./jest-config/setupJest.ts'],
  testEnvironment: 'jsdom',
}
