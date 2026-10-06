import { PolicyEffect } from "./policy-effect.js";

export interface PolicyEvaluationResult {
  decision: PolicyEffect;
  reasonCode: string;
  reason: string;
  matchedRuleIds: string[];
}
