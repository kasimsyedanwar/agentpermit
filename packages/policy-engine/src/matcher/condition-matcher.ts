import {
  PolicyField,
  PolicyOperator,
  type NormalizedAuthorizationRequest,
  type PolicyCondition,
} from "@agentpermit/shared";

import { equals } from "../operators/equals.js";
import { globMatch } from "../operators/glob-match.js";
import { inList } from "../operators/in.js";
import { notEquals } from "../operators/not-equals.js";
import { startsWith } from "../operators/starts-with.js";

function getPolicyFieldValue(
  request: NormalizedAuthorizationRequest,
  field: PolicyField,
): string | undefined {
  switch (field) {
    case PolicyField.AGENT_TYPE:
      return request.agentType;

    case PolicyField.ACTION_TYPE:
      return request.actionType;

    case PolicyField.RESOURCE_TYPE:
      return request.resourceType;

    case PolicyField.RESOURCE_IDENTIFIER:
      return request.resourceIdentifier;

    case PolicyField.PATH:
      return request.path;

    case PolicyField.COMMAND_CATEGORY:
      return request.commandCategory;

    case PolicyField.BRANCH:
      return request.branch;

    case PolicyField.TOOL:
      return request.tool;

    case PolicyField.ENVIRONMENT:
      return request.environment;
  }
}

export function matchesCondition(
  request: NormalizedAuthorizationRequest,
  condition: PolicyCondition,
): boolean {
  const actual = getPolicyFieldValue(request, condition.field);

  if (actual === undefined) {
    return false;
  }

  switch (condition.operator) {
    case PolicyOperator.EQUALS:
      return equals(actual, condition.value);

    case PolicyOperator.NOT_EQUALS:
      return notEquals(actual, condition.value);

    case PolicyOperator.IN:
      return inList(actual, condition.value);

    case PolicyOperator.STARTS_WITH:
      return startsWith(actual, condition.value);

    case PolicyOperator.MATCHES:
      return globMatch(actual, condition.value);
  }
}
