import { describe, expect, test } from "vitest";

import {
  ActionType,
  AgentType,
  PolicyField,
  PolicyOperator,
  type NormalizedAuthorizationRequest,
} from "@agentpermit/shared";

import { matchesCondition } from "../src/matcher/condition-matcher.js";

const baseRequest: NormalizedAuthorizationRequest = {
  organizationId: "org-1",
  projectId: "project-1",
  userId: "user-1",
  agentSessionId: "session-1",
  agentType: AgentType.CLAUDE_CODE,
  actionType: ActionType.WRITE_FILE,
  path: ".env.production",
};

describe("matchesCondition", () => {
  test("matches an EQUALS condition", () => {
    const result = matchesCondition(baseRequest, {
      field: PolicyField.ACTION_TYPE,
      operator: PolicyOperator.EQUALS,
      value: ActionType.WRITE_FILE,
    });

    expect(result).toBe(true);
  });

  test("matches a NOT_EQUALS condition", () => {
    const result = matchesCondition(baseRequest, {
      field: PolicyField.ACTION_TYPE,
      operator: PolicyOperator.NOT_EQUALS,
      value: ActionType.READ_FILE,
    });

    expect(result).toBe(true);
  });

  test("matches an IN condition", () => {
    const result = matchesCondition(baseRequest, {
      field: PolicyField.ACTION_TYPE,
      operator: PolicyOperator.IN,
      value: [ActionType.READ_FILE, ActionType.WRITE_FILE, ActionType.CREATE_FILE],
    });

    expect(result).toBe(true);
  });

  test("matches a STARTS_WITH condition", () => {
    const request: NormalizedAuthorizationRequest = {
      ...baseRequest,
      actionType: ActionType.GIT_PUSH,
      branch: "feature/auth",
    };

    const result = matchesCondition(request, {
      field: PolicyField.BRANCH,
      operator: PolicyOperator.STARTS_WITH,
      value: "feature/",
    });

    expect(result).toBe(true);
  });

  test("matches a MATCHES condition", () => {
    const result = matchesCondition(baseRequest, {
      field: PolicyField.PATH,
      operator: PolicyOperator.MATCHES,
      value: ".env*",
    });

    expect(result).toBe(true);
  });

  test("returns false when the requested policy field is missing", () => {
    const result = matchesCondition(baseRequest, {
      field: PolicyField.BRANCH,
      operator: PolicyOperator.EQUALS,
      value: "main",
    });

    expect(result).toBe(false);
  });

  test("returns false when an EQUALS condition does not match", () => {
    const result = matchesCondition(baseRequest, {
      field: PolicyField.ACTION_TYPE,
      operator: PolicyOperator.EQUALS,
      value: ActionType.READ_FILE,
    });

    expect(result).toBe(false);
  });
});
