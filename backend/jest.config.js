module.exports = {
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/__tests__/**/*.mjs?(x)',
    '**/?(*.)+(spec|test).mjs?(x)',
  ],
  moduleFileExtensions: ['mjs', 'js'],
  modulePathIgnorePatterns: ['.aws', 'constants'],
  moduleNameMapper: {
    // Workaround for Jest not having ESM support yet
    // See: https://github.com/uuidjs/uuid/issues/451
    uuid: require.resolve('uuid'),
  },
}
