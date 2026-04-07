import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./junit.xml",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/db/schema.ts", "lib/display-model.ts", "lib/utils.ts"],
    },
  },
});
