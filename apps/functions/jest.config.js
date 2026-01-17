module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@roaddoggs/core$': '<rootDir>/../../packages/core/src/models/identity',
    '^@roaddoggs/core/(.*)$': '<rootDir>/../../packages/core/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!@roaddoggs)',
  ],
};
