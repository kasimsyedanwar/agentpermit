# AgentPermit

AgentPermit is a centralized authorization system for AI coding agents. It evaluates supported agent actions against predefined policies before execution, allowing teams to control what agents can do within their development environments.

Authorization requests produce one of three decisions:

- `ALLOW` — The action is permitted.
- `DENY` — The action is blocked.
- `REQUIRE_APPROVAL` — The action requires human approval.

AgentPermit uses a deterministic policy engine and a shared authorization model across supported coding agents.

## How It Works

AgentPermit integrates with AI coding agents through their supported pre-execution hooks.

```text
AI Coding Agent (Claude Code / Cursor)
          |
          v
    Pre-execution Hook
          |
          v
    AgentPermit CLI
          |
          v
    AgentPermit API
          |
          v
      Policy Engine
          |
          v
ALLOW / DENY / REQUIRE_APPROVAL
          |
          v
    Host Enforcement
          |
          v
    PostgreSQL Audit
```

The backend evaluates centrally managed policies, while agent-specific integrations handle enforcement.

For example, policies can allow normal source-code modifications while blocking access to sensitive environment files, restricting Git operations, or requiring approval before installing dependencies.

AgentPermit only enforces actions through supported integration points. It does not replace operating system permissions, native agent security controls, or AWS IAM.

## Tech Stack

- **Backend:** Node.js, TypeScript, Express
- **Database:** PostgreSQL, Prisma
- **Package Management:** pnpm workspaces
- **Testing:** Vitest
- **Code Quality:** ESLint, Prettier
- **Deployment:** Docker, AWS

The V1 deployment architecture uses Amazon ECS Fargate, Application Load Balancer, Amazon RDS, ECR, Secrets Manager, IAM, and CloudWatch.

## Project Structure

AgentPermit uses a pnpm monorepo with the following component layout:

```text
agentpermit/
├── apps/
│   ├── api/
│   └── cli/
├── packages/
│   ├── shared/
│   └── policy-engine/
├── tests/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Components are introduced as development progresses. The API handles authentication, policy management, authorization, approvals, and audit records. The CLI connects supported coding agents to the authorization service.

## Getting Started

### Prerequisites

- Node.js 24 or later
- pnpm 12

### Install Dependencies

```bash
pnpm install
```

### Development Commands

Run automated tests:

```bash
pnpm test
```

Check TypeScript types:

```bash
pnpm typecheck
```

Run ESLint:

```bash
pnpm lint
```

Check formatting:

```bash
pnpm format:check
```

Format project files:

```bash
pnpm format
```

The repository is under active development. These commands cover the current development tooling; application-specific startup instructions will be added when the API and CLI are operational.

## License

No license has been assigned to this project.
