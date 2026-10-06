import { PolicyEffect, type PolicyRule } from "@agentpermit/shared";

export interface DecisionResolution {
  decision: PolicyEffect;
  winningRule?: PolicyRule;
}

const EFFECT_PRECEDENCE = [
  PolicyEffect.DENY,
  PolicyEffect.REQUIRE_APPROVAL,
  PolicyEffect.ALLOW,
] as const;

function selectWinningRule(rules: PolicyRule[]): PolicyRule | undefined {
  let winningRule: PolicyRule | undefined;

  for (const rule of rules) {
    if (winningRule === undefined) {
      winningRule = rule;
      continue;
    }

    if (rule.priority > winningRule.priority) {
      winningRule = rule;
      continue;
    }

    if (rule.priority === winningRule.priority && rule.id.localeCompare(winningRule.id) < 0) {
      winningRule = rule;
    }
  }

  return winningRule;
}

export function resolveDecision(matchedRules: PolicyRule[]): DecisionResolution {
  for (const effect of EFFECT_PRECEDENCE) {
    const rulesWithEffect = matchedRules.filter((rule) => rule.effect === effect);

    const winningRule = selectWinningRule(rulesWithEffect);

    if (winningRule !== undefined) {
      return {
        decision: effect,
        winningRule,
      };
    }
  }

  return {
    decision: PolicyEffect.REQUIRE_APPROVAL,
  };
}
