module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
