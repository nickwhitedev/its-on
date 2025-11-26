import { jest } from '@jest/globals'

jest.mock('nanoid', () => {
  return {
    customAlphabet: () => () => 'IDToEleven1',
  }
})
