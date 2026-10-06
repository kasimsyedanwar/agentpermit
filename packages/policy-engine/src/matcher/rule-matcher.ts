import { type NormalizedAuthorizationRequest, type PolicyRule } from "@agentpermit/shared";
import { matchesCondition } from "./condition-matcher.js";

export function matchesRule(request: NormalizedAuthorizationRequest, rule: PolicyRule): boolean {
  if (!rule.enabled) {
    return false;
  }

  if (rule.conditions.length === 0) {
    return false;
  }

  return rule.conditions.every((condition) => matchesCondition(request, condition));
}
