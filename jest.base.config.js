/**
 * Shared Jest base config for all gaqno services.
 *
 * Performance optimizations:
 * - isolatedModules: transpiles without type-checking (fast)
 * - maxWorkers: 1 to avoid OOM/SIGSEGV on large services
 * - cacheDirectory: persistent cache between runs
 *
 * Usage in each service's jest.config.js:
 *   const base = require('../jest.base.config');
 *   module.exports = {
 *     ...base,
 *     collectCoverageFrom: [...],
 *     coverageThreshold: {...},
 *   };
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },
  maxWorkers: 1,
  cacheDirectory: '<rootDir>/.jest-cache',
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
