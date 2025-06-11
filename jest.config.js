module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/src/**/__tests__/**/*.test.js',
    '**/src/**/*.test.js',
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/*.test.js',
    '!src/testGoogleDrive.js',
    '!src/setup.js'
  ],
  
  // Coverage thresholds (more realistic for a bot project)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 40,
      lines: 50,
      statements: 50
    },
    // Stricter requirements for the main bot file
    'src/bot.js': {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Coverage output
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Mock settings
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Timeout for async tests
  testTimeout: 10000
}; 