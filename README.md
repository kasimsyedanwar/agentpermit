# AgentPermit

AgentPermit is a centralized authorization layer for actions initiated by AI coding agents.

The project is designed to evaluate an agent action against centrally managed policies before the action is executed. A request can result in one of three decisions:

- `ALLOW`
- `DENY`
- `REQUIRE_APPROVAL`

The goal is to apply the same authorization model across supported coding agents while keeping policy evaluation deterministic and independent from agent-specific integrations.

## Tech Stack

- TypeScript
- Node.js
- pnpm workspaces
- PostgreSQL
- Prisma
- Express
- Vitest
- ESLint
- Prettier
- Docker
- AWS

AWS services planned for the V1 deployment include ECS Fargate, Application Load Balancer, RDS PostgreSQL, ECR, Secrets Manager, IAM, and CloudWatch.

## Project Structure

AgentPermit is organized as a monorepo.

```text
agentpermit/
├── apps/
├── packages/
├── tests/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Additional applications and packages are added as their implementation begins.

## Local Setup

### Prerequisites

- Node.js
- pnpm

### Install dependencies

```bash
pnpm install
```

### Type checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Check formatting

```bash
pnpm format:check
```

### Format files

```bash
pnpm format
```

### Run tests

```bash
pnpm test
```

The application-specific run commands will be added when the API and CLI are implemented.
