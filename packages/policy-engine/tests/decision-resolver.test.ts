import { describe, expect, test } from "vitest";
import { PolicyEffect, PolicyField, PolicyOperator, type PolicyRule } from "@agentpermit/shared";

import { resolveDecision } from "../src/resolver/decision-resolver.js";

function createRule(id: string, effect: PolicyEffect, priority: number): PolicyRule {
  return {
    id,
    effect,
    priority,
    enabled: true,
    conditions: [
      {
        field: PolicyField.ACTION_TYPE,
        operator: PolicyOperator.EQUALS,
        value: "WRITE_FILE",
      },
    ],
  };
}

describe("resolveDecision", () => {
  test("DENY wins over ALLOW", () => {
    const result = resolveDecision([
      createRule("allow-rule", PolicyEffect.ALLOW, 100),
      createRule("deny-rule", PolicyEffect.DENY, 1),
    ]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.winningRule?.id).toBe("deny-rule");
  });

  test("REQUIRE_APPROVAL wins over ALLOW", () => {
    const result = resolveDecision([
      createRule("allow-rule", PolicyEffect.ALLOW, 100),
      createRule("approval-rule", PolicyEffect.REQUIRE_APPROVAL, 1),
    ]);

    expect(result.decision).toBe(PolicyEffect.REQUIRE_APPROVAL);
    expect(result.winningRule?.id).toBe("approval-rule");
  });

  test("DENY wins over REQUIRE_APPROVAL", () => {
    const result = resolveDecision([
      createRule("approval-rule", PolicyEffect.REQUIRE_APPROVAL, 100),
      createRule("deny-rule", PolicyEffect.DENY, 1),
    ]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.winningRule?.id).toBe("deny-rule");
  });

  test("higher-priority ALLOW cannot override lower-priority DENY", () => {
    const result = resolveDecision([
      createRule("allow-rule", PolicyEffect.ALLOW, 100),
      createRule("deny-rule", PolicyEffect.DENY, 1),
    ]);

    expect(result.decision).toBe(PolicyEffect.DENY);
  });

  test("higher priority wins among rules with the same effect", () => {
    const result = resolveDecision([
      createRule("deny-low", PolicyEffect.DENY, 10),
      createRule("deny-high", PolicyEffect.DENY, 50),
    ]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.winningRule?.id).toBe("deny-high");
  });

  test("rule ID breaks ties deterministically when effect and priority are equal", () => {
    const result = resolveDecision([
      createRule("rule-b", PolicyEffect.ALLOW, 10),
      createRule("rule-a", PolicyEffect.ALLOW, 10),
    ]);

    expect(result.decision).toBe(PolicyEffect.ALLOW);
    expect(result.winningRule?.id).toBe("rule-a");
  });

  test("defaults to REQUIRE_APPROVAL when no rules matched", () => {
    const result = resolveDecision([]);

    expect(result.decision).toBe(PolicyEffect.REQUIRE_APPROVAL);
    expect(result.winningRule).toBeUndefined();
  });
});
