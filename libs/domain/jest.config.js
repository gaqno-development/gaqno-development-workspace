module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@gaqno-ai-platform/shared-kernel$': '<rootDir>/../shared-kernel/src',
  },
};
