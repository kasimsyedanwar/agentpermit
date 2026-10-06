import { describe, expect, test } from "vitest";

import {
  ActionType,
  AgentType,
  CommandCategory,
  PolicyEffect,
  PolicyField,
  PolicyOperator,
  type NormalizedAuthorizationRequest,
  type PolicyRule,
} from "@agentpermit/shared";

import { PolicyEngine } from "../src/engine/policy-engine.js";

const engine = new PolicyEngine();

const baseRequest: NormalizedAuthorizationRequest = {
  organizationId: "org-1",
  projectId: "project-1",
  userId: "user-1",
  agentSessionId: "session-1",
  agentType: AgentType.CLAUDE_CODE,
  actionType: ActionType.WRITE_FILE,
  path: "src/auth.ts",
};

function createActionRule(
  id: string,
  effect: PolicyEffect,
  actionType: ActionType,
  priority = 100,
  enabled = true,
): PolicyRule {
  return {
    id,
    effect,
    priority,
    enabled,
    conditions: [
      {
        field: PolicyField.ACTION_TYPE,
        operator: PolicyOperator.EQUALS,
        value: actionType,
      },
    ],
  };
}

describe("PolicyEngine", () => {
  test("denies WRITE_FILE for .env.production when a matching DENY rule exists", () => {
    const request: NormalizedAuthorizationRequest = {
      ...baseRequest,
      path: ".env.production",
    };

    const denyEnvironmentFilesRule: PolicyRule = {
      id: "deny-environment-files",
      effect: PolicyEffect.DENY,
      priority: 100,
      enabled: true,
      conditions: [
        {
          field: PolicyField.ACTION_TYPE,
          operator: PolicyOperator.IN,
          value: [
            ActionType.READ_FILE,
            ActionType.WRITE_FILE,
            ActionType.CREATE_FILE,
            ActionType.DELETE_FILE,
          ],
        },
        {
          field: PolicyField.PATH,
          operator: PolicyOperator.MATCHES,
          value: ".env*",
        },
      ],
    };

    const result = engine.evaluate(request, [denyEnvironmentFilesRule]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.reasonCode).toBe("POLICY_DENY");
    expect(result.matchedRuleIds).toEqual(["deny-environment-files"]);
    expect(result.reason).toBe("Request denied by matching policy rule deny-environment-files.");
  });

  test("returns ALLOW when an ALLOW rule matches", () => {
    const allowRule = createActionRule("allow-write", PolicyEffect.ALLOW, ActionType.WRITE_FILE);

    const result = engine.evaluate(baseRequest, [allowRule]);

    expect(result.decision).toBe(PolicyEffect.ALLOW);
    expect(result.reasonCode).toBe("POLICY_ALLOW");
    expect(result.matchedRuleIds).toEqual(["allow-write"]);
  });

  test("returns REQUIRE_APPROVAL when a REQUIRE_APPROVAL rule matches", () => {
    const approvalRule = createActionRule(
      "approve-write",
      PolicyEffect.REQUIRE_APPROVAL,
      ActionType.WRITE_FILE,
    );

    const result = engine.evaluate(baseRequest, [approvalRule]);

    expect(result.decision).toBe(PolicyEffect.REQUIRE_APPROVAL);
    expect(result.reasonCode).toBe("POLICY_REQUIRE_APPROVAL");
    expect(result.matchedRuleIds).toEqual(["approve-write"]);
  });

  test("DENY wins when ALLOW and DENY rules both match", () => {
    const allowRule = createActionRule(
      "allow-write",
      PolicyEffect.ALLOW,
      ActionType.WRITE_FILE,
      1000,
    );

    const denyRule = createActionRule("deny-write", PolicyEffect.DENY, ActionType.WRITE_FILE, 1);

    const result = engine.evaluate(baseRequest, [allowRule, denyRule]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.reasonCode).toBe("POLICY_DENY");
  });

  test("REQUIRE_APPROVAL wins when ALLOW and REQUIRE_APPROVAL rules both match", () => {
    const allowRule = createActionRule(
      "allow-write",
      PolicyEffect.ALLOW,
      ActionType.WRITE_FILE,
      1000,
    );

    const approvalRule = createActionRule(
      "approve-write",
      PolicyEffect.REQUIRE_APPROVAL,
      ActionType.WRITE_FILE,
      1,
    );

    const result = engine.evaluate(baseRequest, [allowRule, approvalRule]);

    expect(result.decision).toBe(PolicyEffect.REQUIRE_APPROVAL);
    expect(result.reasonCode).toBe("POLICY_REQUIRE_APPROVAL");
  });

  test("defaults to REQUIRE_APPROVAL when no rule matches", () => {
    const unrelatedRule = createActionRule("allow-read", PolicyEffect.ALLOW, ActionType.READ_FILE);

    const result = engine.evaluate(baseRequest, [unrelatedRule]);

    expect(result.decision).toBe(PolicyEffect.REQUIRE_APPROVAL);
    expect(result.reasonCode).toBe("NO_MATCHING_POLICY");
    expect(result.matchedRuleIds).toEqual([]);
  });

  test("ignores a disabled matching DENY rule", () => {
    const disabledDenyRule = createActionRule(
      "deny-write",
      PolicyEffect.DENY,
      ActionType.WRITE_FILE,
      100,
      false,
    );

    const result = engine.evaluate(baseRequest, [disabledDenyRule]);

    expect(result.decision).toBe(PolicyEffect.REQUIRE_APPROVAL);
    expect(result.reasonCode).toBe("NO_MATCHING_POLICY");
    expect(result.matchedRuleIds).toEqual([]);
  });

  test("fails closed when a file action has no path", () => {
    const request: NormalizedAuthorizationRequest = {
      organizationId: "org-1",
      projectId: "project-1",
      userId: "user-1",
      agentSessionId: "session-1",
      agentType: AgentType.CLAUDE_CODE,
      actionType: ActionType.WRITE_FILE,
    };

    const allowRule = createActionRule("allow-write", PolicyEffect.ALLOW, ActionType.WRITE_FILE);

    const result = engine.evaluate(request, [allowRule]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.reasonCode).toBe("INVALID_AUTHORIZATION_CONTEXT");
    expect(result.matchedRuleIds).toEqual([]);
  });

  test("fails closed when GIT_PUSH has no branch", () => {
    const request: NormalizedAuthorizationRequest = {
      organizationId: "org-1",
      projectId: "project-1",
      userId: "user-1",
      agentSessionId: "session-1",
      agentType: AgentType.CLAUDE_CODE,
      actionType: ActionType.GIT_PUSH,
    };

    const allowRule = createActionRule("allow-git-push", PolicyEffect.ALLOW, ActionType.GIT_PUSH);

    const result = engine.evaluate(request, [allowRule]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.reasonCode).toBe("INVALID_AUTHORIZATION_CONTEXT");
    expect(result.matchedRuleIds).toEqual([]);
  });

  test("fails closed when SHELL_EXECUTE has no command category", () => {
    const request: NormalizedAuthorizationRequest = {
      organizationId: "org-1",
      projectId: "project-1",
      userId: "user-1",
      agentSessionId: "session-1",
      agentType: AgentType.CLAUDE_CODE,
      actionType: ActionType.SHELL_EXECUTE,
      command: "npm test",
    };

    const allowRule = createActionRule("allow-shell", PolicyEffect.ALLOW, ActionType.SHELL_EXECUTE);

    const result = engine.evaluate(request, [allowRule]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.reasonCode).toBe("INVALID_AUTHORIZATION_CONTEXT");
    expect(result.matchedRuleIds).toEqual([]);
  });

  test("returns all matched rule IDs in deterministic order", () => {
    const allowRule = createActionRule("rule-z-allow", PolicyEffect.ALLOW, ActionType.WRITE_FILE);

    const approvalRule = createActionRule(
      "rule-m-approval",
      PolicyEffect.REQUIRE_APPROVAL,
      ActionType.WRITE_FILE,
    );

    const denyRule = createActionRule("rule-a-deny", PolicyEffect.DENY, ActionType.WRITE_FILE);

    const result = engine.evaluate(baseRequest, [allowRule, denyRule, approvalRule]);

    expect(result.decision).toBe(PolicyEffect.DENY);
    expect(result.matchedRuleIds).toEqual(["rule-a-deny", "rule-m-approval", "rule-z-allow"]);
  });

  test("allows a categorized shell action when an ALLOW rule matches", () => {
    const request: NormalizedAuthorizationRequest = {
      organizationId: "org-1",
      projectId: "project-1",
      userId: "user-1",
      agentSessionId: "session-1",
      agentType: AgentType.CLAUDE_CODE,
      actionType: ActionType.SHELL_EXECUTE,
      command: "npm test",
      commandCategory: CommandCategory.TEST,
    };

    const allowTestsRule: PolicyRule = {
      id: "allow-tests",
      effect: PolicyEffect.ALLOW,
      priority: 100,
      enabled: true,
      conditions: [
        {
          field: PolicyField.ACTION_TYPE,
          operator: PolicyOperator.EQUALS,
          value: ActionType.SHELL_EXECUTE,
        },
        {
          field: PolicyField.COMMAND_CATEGORY,
          operator: PolicyOperator.EQUALS,
          value: CommandCategory.TEST,
        },
      ],
    };

    const result = engine.evaluate(request, [allowTestsRule]);

    expect(result.decision).toBe(PolicyEffect.ALLOW);
    expect(result.reasonCode).toBe("POLICY_ALLOW");
    expect(result.matchedRuleIds).toEqual(["allow-tests"]);
  });
});
