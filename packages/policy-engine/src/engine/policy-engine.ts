import {
  ActionType,
  AgentType,
  CommandCategory,
  PolicyEffect,
  ResourceType,
  type NormalizedAuthorizationRequest,
  type PolicyEvaluationResult,
  type PolicyRule,
} from "@agentpermit/shared";

import { matchesRule } from "../matcher/rule-matcher.js";
import { resolveDecision } from "../resolver/decision-resolver.js";

const VALID_AGENT_TYPES = new Set<string>(Object.values(AgentType));
const VALID_ACTION_TYPES = new Set<string>(Object.values(ActionType));
const VALID_COMMAND_CATEGORIES = new Set<string>(Object.values(CommandCategory));
const VALID_RESOURCE_TYPES = new Set<string>(Object.values(ResourceType));

const VALID_ENVIRONMENTS = new Set(["development", "staging", "production"]);

const FILE_ACTIONS = new Set<ActionType>([
  ActionType.READ_FILE,
  ActionType.WRITE_FILE,
  ActionType.CREATE_FILE,
  ActionType.DELETE_FILE,
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidAuthorizationContext(request: NormalizedAuthorizationRequest): boolean {
  if (
    !isNonEmptyString(request.organizationId) ||
    !isNonEmptyString(request.projectId) ||
    !isNonEmptyString(request.userId) ||
    !isNonEmptyString(request.agentSessionId)
  ) {
    return false;
  }

  if (!VALID_AGENT_TYPES.has(request.agentType)) {
    return false;
  }

  if (!VALID_ACTION_TYPES.has(request.actionType)) {
    return false;
  }

  if (request.resourceType !== undefined && !VALID_RESOURCE_TYPES.has(request.resourceType)) {
    return false;
  }

  if (
    request.commandCategory !== undefined &&
    !VALID_COMMAND_CATEGORIES.has(request.commandCategory)
  ) {
    return false;
  }

  if (request.environment !== undefined && !VALID_ENVIRONMENTS.has(request.environment)) {
    return false;
  }

  if (FILE_ACTIONS.has(request.actionType) && !isNonEmptyString(request.path)) {
    return false;
  }

  if (request.actionType === ActionType.SHELL_EXECUTE && request.commandCategory === undefined) {
    return false;
  }

  if (
    (request.actionType === ActionType.GIT_PUSH ||
      request.actionType === ActionType.GIT_FORCE_PUSH) &&
    !isNonEmptyString(request.branch)
  ) {
    return false;
  }

  if (request.actionType === ActionType.MCP_TOOL_CALL && !isNonEmptyString(request.tool)) {
    return false;
  }

  return true;
}

function getReasonCode(decision: PolicyEffect): string {
  switch (decision) {
    case PolicyEffect.DENY:
      return "POLICY_DENY";

    case PolicyEffect.REQUIRE_APPROVAL:
      return "POLICY_REQUIRE_APPROVAL";

    case PolicyEffect.ALLOW:
      return "POLICY_ALLOW";
  }
}

function getPolicyReason(decision: PolicyEffect, winningRuleId: string): string {
  switch (decision) {
    case PolicyEffect.DENY:
      return `Request denied by matching policy rule ${winningRuleId}.`;

    case PolicyEffect.REQUIRE_APPROVAL:
      return `Request requires approval because of matching policy rule ${winningRuleId}.`;

    case PolicyEffect.ALLOW:
      return `Request allowed by matching policy rule ${winningRuleId}.`;
  }
}

export class PolicyEngine {
  evaluate(request: NormalizedAuthorizationRequest, rules: PolicyRule[]): PolicyEvaluationResult {
    if (!isValidAuthorizationContext(request)) {
      return {
        decision: PolicyEffect.DENY,
        reasonCode: "INVALID_AUTHORIZATION_CONTEXT",
        reason: "Authorization context is incomplete or invalid.",
        matchedRuleIds: [],
      };
    }

    const matchedRules = rules.filter((rule) => matchesRule(request, rule));

    const matchedRuleIds = [...new Set(matchedRules.map((rule) => rule.id))].sort((left, right) =>
      left.localeCompare(right),
    );

    const resolution = resolveDecision(matchedRules);

    if (resolution.winningRule === undefined) {
      return {
        decision: PolicyEffect.REQUIRE_APPROVAL,
        reasonCode: "NO_MATCHING_POLICY",
        reason: "No policy rule matched; approval is required by default.",
        matchedRuleIds: [],
      };
    }

    return {
      decision: resolution.decision,
      reasonCode: getReasonCode(resolution.decision),
      reason: getPolicyReason(resolution.decision, resolution.winningRule.id),
      matchedRuleIds,
    };
  }
}
