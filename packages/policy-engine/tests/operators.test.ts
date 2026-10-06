import { describe, expect, test } from "vitest";
import { equals } from "../src/operators/equals.js";
import { globMatch } from "../src/operators/glob-match.js";
import { inList } from "../src/operators/in.js";
import { notEquals } from "../src/operators/not-equals.js";
import { startsWith } from "../src/operators/starts-with.js";

describe("policy operators", () => {
  describe("equals", () => {
    test("returns true when values are equal", () => {
      expect(equals("WRITE_FILE", "WRITE_FILE")).toBe(true);
    });

    test("returns false when values are different", () => {
      expect(equals("READ_FILE", "WRITE_FILE")).toBe(false);
    });
  });

  describe("notEquals", () => {
    test("returns true when values are different", () => {
      expect(notEquals("main", "feature/auth")).toBe(true);
    });

    test("returns false when values are equal", () => {
      expect(notEquals("main", "main")).toBe(false);
    });
  });

  describe("inList", () => {
    test("returns true when actual value exists in expected values", () => {
      expect(inList("main", ["main", "master"])).toBe(true);
    });

    test("returns false when actual value does not exist in expected values", () => {
      expect(inList("develop", ["main", "master"])).toBe(false);
    });
  });

  describe("startsWith", () => {
    test("returns true when actual value starts with expected prefix", () => {
      expect(startsWith("feature/auth", "feature/")).toBe(true);
    });

    test("returns false when actual value does not start with expected prefix", () => {
      expect(startsWith("main", "feature/")).toBe(false);
    });
  });

  describe("globMatch", () => {
    test("matches a single-segment wildcard", () => {
      expect(globMatch(".env.production", ".env*")).toBe(true);
    });

    test("matches files under a directory", () => {
      expect(globMatch("src/auth.ts", "src/**")).toBe(true);
    });

    test("matches nested files under a directory", () => {
      expect(globMatch("src/modules/auth.ts", "src/**")).toBe(true);
    });

    test("does not match a different directory", () => {
      expect(globMatch("test/auth.ts", "src/**")).toBe(false);
    });
  });
});
