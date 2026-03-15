module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  testTimeout: 30000,
  forceExit: true,
  setupFiles: ["<rootDir>/tests/setup.ts"],
};
