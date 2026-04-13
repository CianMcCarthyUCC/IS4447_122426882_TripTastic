module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
