# Enerthya Host

An open-source, self-hosted PaaS. Connect your servers, point at a Git repository or a Docker
image, and Enerthya Host handles the build, the deploy, the domain, the TLS certificate, the
logs, the backups and the monitoring — on hardware you control.

Early build. The monorepo, shared packages and the worker boundary exist; authentication,
deployments, backups and restore are the next stages and are not wired yet. Nothing here claims
to host an application until it can.

## Architecture

| Path | Role |
|---|---|
| `apps/web` | Next.js 16 App Router dashboard and thin API. Enqueues work, never builds. |
| `apps/worker` | Separate Node process running BullMQ: builds, deploys, health checks, backups, metrics, cron. |
| `packages/core` | Domain logic — deploy engine, dockerode, ssh2, simple-git, execa, proxy config. |
| `packages/db` | Drizzle schema, migrations and the typed client (Postgres). |
| `packages/ui` | Shared shadcn/ui primitives. |
| `packages/config` | tsconfig presets and typed environment validation. |

Long deploys, WebSockets and background jobs never run inside a Next route handler.

## Development

Requirements: Node 24 or newer, pnpm 12, and Podman or Docker for the supporting services.

```sh
pnpm install
pnpm dev             # first run creates apps/web/.env with generated secrets
pnpm typecheck
pnpm lint
pnpm test
pnpm build           # standalone server under apps/web/.next/standalone
pnpm start
```

Database and queue commands (available once the schema lands):

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Releases

Versions follow Conventional Commits. On every push to `main`, release-please opens (or updates) a
release PR with the next version and the changelog; merging that PR tags `vX.Y.Z`, writes
`CHANGELOG.md` and publishes the GitHub release. A second workflow then builds the standalone
server and attaches `enerthya-host-vX.Y.Z.tar.gz` plus `SHA256SUMS`, the pair `install.sh`
downloads and verifies before extracting.

Nothing is published by hand, and `./install.sh --version vX.Y.Z` pins an older release.

## Configuration

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string (BullMQ) |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `ENCRYPTION_KEY` | 32-byte key for AES-256-GCM encryption of secrets at rest |
| `PORT` | Panel port (default `8420` in a source install) |
| `HOSTNAME` | Bind address; keep it loopback unless TLS terminates in front |

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/Versune/enerthya-host/main/install.sh | bash
```

Or from a checkout, building locally:

```sh
./install.sh --from-source "$PWD"
```

`./install.sh --check` reports what the current machine has and installs nothing. The script
verifies the release checksum when it downloads a build.

## Status

- Works: pnpm workspace, typed packages, Biome, Vitest, standalone build, container-runtime
  detection, email/password sign-up and sign-in through better-auth, organizations created at
  sign-up, the dashboard shell, and a server registry: the local machine is always the first row,
  remote servers take an SSH key encrypted with AES-256-GCM, and a probe reports the runtime.
- Not yet: invitations and role enforcement, projects, applications, deployments, domains and SSL,
  encrypted env vars, logs and terminal, managed databases, backups, metrics, notifications.

See `CLAUDE.md` for the architecture rules and the stage order, `PRODUCT.md` for product truth.
`DESIGN.md` currently describes the legacy panel and is rewritten with the new dashboard.

## Security

Secrets are encrypted at rest with AES-256-GCM. External commands run through `execa` argument
arrays, never through a shell string. Every input is validated with zod on both the API and the
form. The panel binds loopback by default, sends nothing to a third party, and refuses
cross-origin state-changing requests.

## Licence

Apache-2.0. Developed under Versune.
