# Roadmap

Enerthya Host is an open-source, self-hosted PaaS built around one claim: a deployment is only as
good as its last verified restore. This roadmap is directional, not a promise of dates; each stage
ships working instead of appearing as a disabled button.

Current release: **0.5.0**.

## Shipped

| Area | What works |
|---|---|
| Foundation | pnpm monorepo, Drizzle schema (18 tables), Biome, Vitest, Playwright, release automation |
| Install | container-first installer: Docker, Postgres, Redis, panel, migrations, healthcheck; `--with-runtime` adds the deploy worker |
| Auth | better-auth email/password, organizations, sessions, 2FA-capable schema |
| Dashboard | shell with sidebar, ⌘K palette, dark by default |
| Servers | local-first registry, AES-256-GCM SSH keys, runtime probe, host-key pinning |
| Projects | projects with production/staging environments; writes gated by owner/admin |
| Applications | repository or image attached to an environment, with build type, port and healthcheck path; unique slug per environment |
| Backups | `pg_dump`, a restore into a throwaway server before it counts, and upload to an S3-compatible bucket when configured |
| Managed Postgres | one-click database with its own volume and a generated password, provisioned by the worker |
| Metrics | CPU and memory per running container, sampled on demand by the worker |
| Notifications | Discord webhook or generic endpoint on `deployment.failed`, URL encrypted at rest |
| Container log | the running container's output, requested over a Postgres channel and tailed by the worker |
| Deploy log |Each  deployment records every step, from the claim to the swap or the failure |
| Domains | per application, published to a generated Caddy config; TLS is Caddy's job |
| Private repos | per-application ed25519 deploy key, encrypted at rest, used for the clone |
| Auto-deploy | GitHub webhook per application, HMAC-verified against the application's own secret, branch-filtered |
| Env vars | per application, encrypted at rest, runtime and optional build-time, injected by the worker |
| Deployments | queue, pipeline and history: pull or clone → build the Dockerfile → start → health check → stop the previous container; a failed run removes its own container and records why; rollback re-runs the previous image that reached running |

## Next — the deploy path

1. **Zero-downtime and resumable deploys** — keep the old container serving through the handover
   and let an interrupted deployment continue instead of restarting from the clone.
2. **Nixpacks and compose** — the two build types the schema already offers and the worker refuses
   with an explicit message.

## Later

- An interactive web terminal (logs are live; stdin is not).
- One-click databases (Postgres, MySQL, Redis, MongoDB) with scheduled backups to S3/R2/MinIO and
  a restore that is verified, not assumed.
- Network and disk metrics, and per-server numbers (the per-container CPU and memory exist).
- Email notifications (only webhook and Discord exist today).
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
