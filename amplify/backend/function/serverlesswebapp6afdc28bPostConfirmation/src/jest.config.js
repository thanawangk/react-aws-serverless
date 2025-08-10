/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {},
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
