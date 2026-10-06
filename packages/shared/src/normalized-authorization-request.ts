import { ActionType } from "./action-type.js";
import { AgentType } from "./agent-type.js";
import { CommandCategory } from "./command-category.js";
import { ResourceType } from "./resource-type.js";

export interface NormalizedAuthorizationRequest {
  organizationId: string;
  projectId: string;
  userId: string;
  agentSessionId: string;
  agentType: AgentType;
  actionType: ActionType;
  resourceType?: ResourceType;
  resourceIdentifier?: string;
  path?: string;
  command?: string;
  commandCategory?: CommandCategory;
  branch?: string;
  tool?: string;
  environment?: "development" | "staging" | "production";
}
