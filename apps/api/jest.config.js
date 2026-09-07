/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        diagnostics: { ignoreCodes: [151002] },
        tsconfig: {
          module: "ESNext",
          moduleResolution: "Node",
          esModuleInterop: true,
          isolatedModules: true,
          strict: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  setupFiles: ["<rootDir>/src/__tests__/setup-env.ts"],
  testTimeout: 120_000,
};

export default config;
