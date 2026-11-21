# Enerthya Host — working notes for Claude

## What this is

An open-source, self-hosted PaaS in the Coolify class. You connect servers, point at a Git
repository or a Docker image, and the platform runs the build, the deployment, the domain, the
TLS certificate, the logs, the backups and the monitoring.

The earlier single-machine panel (one local administrator, no database) has been replaced:
accounts, sessions and organizations are better-auth rows in this install's Postgres. The
paper-and-ink styling in `panel.css` is still what the auth screens wear; the dashboard shell
replaces it in Stage 5.

Early build. The monorepo, shared packages and the worker boundary exist. Nothing deploys yet:
never write copy or UI that implies a deployment, backup or restore works.

## Architecture — the boundary is not negotiable

```
apps/web       Next.js App Router dashboard + thin API. Never builds, deploys or waits on SSH.
apps/worker    Separate Node process. BullMQ consumers: builds, deploys, health checks,
               backups, metrics, cron. Anything long-running lives here.
packages/core  Domain logic: deploy engine, dockerode, ssh2, simple-git, execa, proxy config.
packages/db    Drizzle schema, migrations and the typed client. Postgres.
packages/ui    Shared shadcn/ui primitives, consumed by apps/web.
packages/config tsconfig presets and typed env validation (@t3-oss/env-nextjs).
```

- Postgres and Redis are required services. Redis is BullMQ's transport, never a cache of truth.
- A Next route handler authenticates, validates and enqueues. It does not run a build.
- The worker is idempotent and resumable: a deploy interrupted mid-step resumes, never restarts
  from a half-state.
- The reverse proxy (Caddy or Traefik) is generated from config. SSL is the proxy's job; we never
  reimplement ACME.

## Commands

```sh
pnpm install           # install the whole workspace
pnpm dev               # http://localhost:3000 (web only)
pnpm dev:worker        # BullMQ consumer for the deployment queue (needs Redis)
pnpm build             # standalone Next build
pnpm start             # run the standalone server
pnpm typecheck         # tsc --noEmit in every package — must pass before any commit
pnpm lint              # biome check .
pnpm lint:fix          # biome check --write .
pnpm test              # vitest in every package that has tests
pnpm db:generate       # drizzle-kit generate (packages/db)
pnpm db:migrate        # apply migrations
pnpm db:studio         # drizzle studio
```

Node 24+, pnpm 12 (`packageManager` is pinned). Podman or Docker for the dev services.

Environment: `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `ENCRYPTION_KEY` (32 bytes,
AES-256-GCM), plus `PORT`/`HOSTNAME` for the panel. Typed validation lands with
`packages/config` in Stage 2; nothing reads an unvalidated env var afterwards.

## Security invariants — do not weaken

- **Secrets at rest** (env vars, SSH private keys, registry credentials, S3 keys) are encrypted
  with AES-256-GCM using `ENCRYPTION_KEY`. Never stored plaintext, never returned by an API.
- **No shell interpolation.** Every external command goes through `execa` with an argument array.
  A user-supplied value never becomes part of a shell string, a `sh -c`, or a proxy config line
  without escaping at the point of generation.
- **Every input is validated with zod** — on the API and on the form, both. The form schema is
  the API schema, imported from `packages/core`, not duplicated.
- Session cookies are HttpOnly and SameSite=Lax at minimum; state-changing requests still check
  origin. There is no local-password fallback once better-auth is in.
- Deploy operations are idempotent. A retried job must not create a second container, a second
  certificate, or a second backup.
- No telemetry, no analytics, no external font or script in the panel itself.
- TypeScript strict, no `any`. `pnpm typecheck` failing is a broken build, not a warning.

## Layout while the migration is in flight

```
apps/web/app/          `/` (dashboard), `/sign-in`, `/sign-up`
apps/web/app/api/      auth/[...all] (better-auth), health, runtime
apps/web/lib/          auth.ts (server instance), auth-client.ts, validation/, runtime.ts
apps/worker/src/       BullMQ consumer for the deployment queue; resolves the source today
packages/core/src/     domain logic; `toSlug` is the first shared primitive
packages/db/src/       Drizzle schema, migrations and every query (Postgres)
DESIGN.md              the design system — currently describes the legacy panel, rewritten in
                       Stage 5 (dark mode default, shadcn)
PRODUCT.md             product truth
install.sh             standalone installer; expects the monorepo layout and pnpm
```

## Design direction

Dark mode is the default, shadcn/ui is the component base, and custom CSS stays minimal. The
legacy paper-and-ink rules in `DESIGN.md` belong to the previous product and are being retired,
not extended — but the underlying discipline holds: no gradients, no decorative shadows, no
colour used as decoration. Status colours mean a state and only a state.

Copy is English, technical, and states what is true. A missing capability says so instead of
showing a disabled control.

## Roadmap, in order

1. ~~Monorepo structure and configs~~ (done)
2. Complete Drizzle schema: users, organizations, members, servers, projects, environments,
   applications, deployments, domains, env_vars, databases, backups, notifications.
3. Dev `docker-compose.yml`: Postgres + Redis.
4. better-auth with the organizations plugin and owner/admin/member RBAC; Drizzle adapter.
   Sign-up, sign-in, sign-out and the organization created at sign-up exist; enforcing roles on
   API routes and invitations still do not.
5. Dashboard shell: sidebar, command palette, dark mode default.
6. Servers over SSH: key validation, Docker install/verify, localhost by default.
7. Projects, environments, applications (Git webhook, deploy key, Dockerfile/Nixpacks/compose).
8. Deploy pipeline: clone → build → healthcheck → zero-downtime swap → rollback.
9. Domains and automatic SSL through the generated proxy config.
10. Env vars, encrypted, build-time vs runtime.
11. Real-time logs (SSE/WebSocket) and the web terminal.
12. One-click databases with scheduled backups to S3/R2/MinIO.
13. Metrics per container and per server; notifications (Discord, email, webhook); templates.

Each stage ships working. A placeholder is not a stage.

## CI and repository

- `main` is the default branch; work happens on feature branches and lands through PRs.
- `CI` runs install, lint, typecheck, unit tests, build and the Playwright suite.
- Releases are cut by merging the release PR that release-please opens on `main`. Its tag
  (`vX.Y.Z`) triggers the artifact workflow, which attaches `enerthya-host-vX.Y.Z.tar.gz` and
  `SHA256SUMS`; `install.sh` verifies that pair. Do not create releases or assets by hand.
- The enterprise forbids `GITHUB_TOKEN` from creating PRs, so release-please authenticates with
  `RELEASE_PLEASE_TOKEN`: a fine-grained PAT with **Contents: write** and **Pull requests: write**
  on this repository. Without that secret the release workflow fails at "create pull request".
- Commit messages are Conventional Commits because they decide the next version.
- CodeQL uses **GitHub's default setup**. Do not add `.github/workflows/codeql.yml`: an advanced
  configuration cannot upload alongside the default setup.
- Dependabot updates npm and Actions weekly and groups dev minors.
- Do not push before the user has reviewed the branch.
- `.impeccable/` is tooling state and must never be committed.

## Things that burned us

- A marketing site was built and discarded before this repository: the product opens into the
  panel, not into a landing page.
- The previous product was a Python CLI; its code is archived outside this repo. Do not copy
  behavior from it without re-verifying.
- The npm-era layout (root `app/`, `npm ci`, `package-lock.json`) is gone. Do not reintroduce a
  second package manager or a root-level Next app.
- Secrets left in `.env` files that get committed are a repeat offender: `.env*` stays ignored
  and every new secret is read through `packages/config`.
