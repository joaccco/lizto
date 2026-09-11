import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("T3a: No fabricated providers guardian (anti-fictitious data policy)", () => {
  it("strictly ensures mock-data.ts has been deleted and does not exist", () => {
    const mockDataPath = path.resolve(__dirname, "../mock-data.ts");
    expect(fs.existsSync(mockDataPath)).toBe(false);
  });

  it("strictly prohibits any module from exporting fabricated provider arrays or mock data", () => {
    const srcDir = path.resolve(__dirname, "../../");

    function checkDir(dir: string): string[] {
      const forbiddenFiles: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
            forbiddenFiles.push(...checkDir(fullPath));
          }
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          if (fullPath.includes("no-mock-providers.test.ts")) continue;

          const content = fs.readFileSync(fullPath, "utf-8");
          if (
            content.includes("export const MOCK_PROVIDERS = [") ||
            content.includes("export const MOCK_PROVIDERS: Provider[] = [")
          ) {
            forbiddenFiles.push(fullPath);
          }
        }
      }
      return forbiddenFiles;
    }

    const violations = checkDir(srcDir);
    expect(violations).toEqual([]);
  });

  it("prohibits imports of the deleted mock-data module across the entire codebase", () => {
    const srcDir = path.resolve(__dirname, "../../");
    const violatingImports: string[] = [];

    function scanImports(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
            scanImports(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          if (fullPath.includes("no-mock-providers.test.ts")) continue;
          const content = fs.readFileSync(fullPath, "utf-8");
          if (content.includes("mock-data")) {
            violatingImports.push(fullPath);
          }
        }
      }
    }

    scanImports(srcDir);
    expect(violatingImports).toEqual([]);
  });
});
