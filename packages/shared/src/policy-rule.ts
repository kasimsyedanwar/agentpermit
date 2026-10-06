import { PolicyCondition } from "./policy-condition.js";
import { PolicyEffect } from "./policy-effect.js";

export interface PolicyRule {
  id: string;
  effect: PolicyEffect;
  priority: number;
  enabled: boolean;
  conditions: PolicyCondition[];
}
