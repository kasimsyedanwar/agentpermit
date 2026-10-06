import { describe, expect, test } from "vitest";

import {
  ActionType,
  AgentType,
  PolicyEffect,
  PolicyField,
  PolicyOperator,
  type NormalizedAuthorizationRequest,
  type PolicyRule,
} from "@agentpermit/shared";

import { matchesRule } from "../src/matcher/rule-matcher.js";

const baseRequest: NormalizedAuthorizationRequest = {
  organizationId: "org-1",
  projectId: "project-1",
  userId: "user-1",
  agentSessionId: "session-1",
  agentType: AgentType.CLAUDE_CODE,
  actionType: ActionType.WRITE_FILE,
  path: ".env.production",
};

function createEnvironmentRule(overrides: Partial<PolicyRule> = {}): PolicyRule {
  return {
    id: "deny-environment-files",
    effect: PolicyEffect.DENY,
    priority: 100,
    enabled: true,
    conditions: [
      {
        field: PolicyField.ACTION_TYPE,
        operator: PolicyOperator.EQUALS,
        value: ActionType.WRITE_FILE,
      },
      {
        field: PolicyField.PATH,
        operator: PolicyOperator.MATCHES,
        value: ".env*",
      },
    ],
    ...overrides,
  };
}

describe("matchesRule", () => {
  test("returns true when every condition matches", () => {
    const rule = createEnvironmentRule();

    expect(matchesRule(baseRequest, rule)).toBe(true);
  });

  test("returns false when one condition does not match", () => {
    const request: NormalizedAuthorizationRequest = {
      ...baseRequest,
      actionType: ActionType.READ_FILE,
    };

    const rule = createEnvironmentRule();

    expect(matchesRule(request, rule)).toBe(false);
  });

  test("returns false when the rule is disabled", () => {
    const rule = createEnvironmentRule({
      enabled: false,
    });

    expect(matchesRule(baseRequest, rule)).toBe(false);
  });

  test("returns false when the rule has no conditions", () => {
    const rule = createEnvironmentRule({
      conditions: [],
    });

    expect(matchesRule(baseRequest, rule)).toBe(false);
  });

  test("uses AND semantics across multiple conditions", () => {
    const matchingRequest: NormalizedAuthorizationRequest = {
      ...baseRequest,
      actionType: ActionType.WRITE_FILE,
      path: ".env.production",
    };

    const nonMatchingRequest: NormalizedAuthorizationRequest = {
      ...baseRequest,
      actionType: ActionType.WRITE_FILE,
      path: "src/auth.ts",
    };

    const rule = createEnvironmentRule();

    expect(matchesRule(matchingRequest, rule)).toBe(true);
    expect(matchesRule(nonMatchingRequest, rule)).toBe(false);
  });
});
