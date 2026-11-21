# Roadmap

Enerthya Host is an open-source, self-hosted PaaS built around one claim: a deployment is only as
good as its last verified restore. This roadmap is directional, not a promise of dates; each stage
ships working instead of appearing as a disabled button.

Current release: **0.3.0**.

## Shipped

| Area | What works |
|---|---|
| Foundation | pnpm monorepo, Drizzle schema (18 tables), Biome, Vitest, Playwright, release automation |
| Install | container-first installer: Docker, Postgres, Redis, panel, migrations, healthcheck |
| Auth | better-auth email/password, organizations, sessions, 2FA-capable schema |
| Dashboard | shell with sidebar, ⌘K palette, dark by default |
| Servers | local-first registry, AES-256-GCM SSH keys, runtime probe, host-key pinning |
| Projects | projects with production/staging environments; writes gated by owner/admin |

## Next — the deploy path

1. **Applications** — attach a repository (public, or private with a deploy key) or an image;
   choose Dockerfile, Nixpacks or compose; per-environment configuration.
2. **Worker** — BullMQ consumers for build, deploy, healthcheck, backups and cron; the panel only
   enqueues and reads state.
3. **Deploy pipeline** — clone → build → healthcheck → zero-downtime swap → rollback, idempotent
   and resumable, with the commit and image recorded per deployment.
4. **Domains and TLS** — generate Caddy or Traefik config; never reimplement ACME.
5. **Env vars** — encrypted at rest, with the build-time/runtime distinction per variable.

## Later

- Real-time build and runtime logs, plus a web terminal.
- One-click databases (Postgres, MySQL, Redis, MongoDB) with scheduled backups to S3/R2/MinIO and
  a restore that is verified, not assumed.
- CPU/RAM/network metrics per container and per server.
- Notifications (Discord, email, webhook).
- Service templates.
- Invitations and full RBAC screens; roles are stored and enforced on project writes today.
- Docker socket mount (or agent) so the panel container can manage the host runtime directly.
- Published container images, so installing pulls instead of building locally.

## Not planned

- A hosted/SaaS version, billing, or per-seat pricing.
- A CLI as the primary interface; the panel is the product.
- Telemetry, analytics, or third-party requests from the panel.
- Windows-native containers; Windows runs the Linux stack in WSL2.

## Following along

Releases and their notes are on the [releases page](https://github.com/Versune/enerthya-host/releases).
Design decisions live in `DESIGN.md`, product truth in `PRODUCT.md`, and the architecture rules in
`CLAUDE.md`. Issues that challenge the claim — especially around backups and restores — are the
most useful contribution.
