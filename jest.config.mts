import type { Config as SwcConfig } from '@swc/core';
import type { Config as JestConfig } from 'jest';

const swcCongfig: SwcConfig = {
  jsc: {
    parser: { syntax: 'typescript' },
    target: 'esnext',
  },
  sourceMaps: 'inline',
};

const config: JestConfig = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.m?[jt]sx?$': [ '@swc/jest', swcCongfig ],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@faker-js/faker|uuid|zod)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.(js|mjs|cjs)$': '$1',
    '^#src/(.*)\\.(js|mjs|cjs)$': '<rootDir>/src/$1',
    '^#test/(.*)\\.(js|mjs|cjs)$': '<rootDir>/__test__/$1',
    '^#lib/(.*)\\.(js|mjs|cjs)$': '<rootDir>/src/lib/$1',
  },
  setupFiles: [
    'dotenv/config',
    '<rootDir>/jest.env.mts',
  ],
  collectCoverage: true,
  collectCoverageFrom: [ 'src/**/*.ts', 'src/**/*.mts' ],
};

export default config;
