module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!**/node_modules/**'
  ],
  setupFilesAfterEnv: ['./server/tests/setup.js'],
  testTimeout: 10000
};