import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  testRegex: '\\.e2e-spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@prisma-generated/(.*)$': '<rootDir>/src/generated/prisma/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@db/(.*)$': '<rootDir>/db/$1',
    '^@prisma-client$': '<rootDir>/src/generated/prisma/client',
    '^@prisma-class$': '<rootDir>/src/generated/prisma-class',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: '<rootDir>/test/setup-e2e.ts',
  globalTeardown: '<rootDir>/test/teardown-e2e.ts',
  testTimeout: 60_000,
  verbose: true,
  // Single worker so the shared e2e DB isn't trampled by parallel suites
  maxWorkers: 1,
};

export default config;
