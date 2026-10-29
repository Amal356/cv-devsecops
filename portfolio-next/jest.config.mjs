import nextJest from "next/jest.js";

// next/jest reprend la configuration de Next.js (SWC, alias "@/", fichiers CSS…)
const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
});
