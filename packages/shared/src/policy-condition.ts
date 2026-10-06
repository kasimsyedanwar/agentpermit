import { PolicyField } from "./policy-field.js";
import { PolicyOperator } from "./policy-operator.js";

export interface ScalarPolicyCondition {
  field: PolicyField;
  operator:
    | PolicyOperator.EQUALS
    | PolicyOperator.NOT_EQUALS
    | PolicyOperator.STARTS_WITH
    | PolicyOperator.MATCHES;
  value: string;
}

export interface InPolicyCondition {
  field: PolicyField;
  operator: PolicyOperator.IN;
  value: string[];
}

export type PolicyCondition = ScalarPolicyCondition | InPolicyCondition;
