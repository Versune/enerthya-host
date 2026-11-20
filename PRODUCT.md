# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 + TypeScript as a standalone Node server: pages and API routes in one application,
installed by `install.sh`, with no separate command line interface and no Python runtime. The panel
is the product. Container work goes through Podman or Docker directly from the server, so the
repository's only languages are TypeScript and the host's own tooling.

## Users

**Primary — the solo self-hoster.** One person runs a VPS, installed Enerthya Host because the
restore story was the point, and is the only account on the machine. They open the panel to see
whether the deployment is healthy, whether the last backup verified, and what the engine actually
reported. They are comfortable in a terminal and will drop to it the moment the panel hides
something.

**Secondary — a small team (2–5).** The same installation, operated by more than one person. Some
deploy, some only read. They need separate accounts and roles, and they need to know who changed
what. A solo installation must be able to stay solo: adding a team is an option, never a
requirement.

The product must serve both from the same first run: the setup screen creates one administrator,
and adding people later does not require reinstalling or reconfiguring anything.

## Product Purpose

Enerthya Host deploys one application with PostgreSQL on rootless Podman and verifies an isolated
restore before you need one. The panel is the only interface. Success is a
person who can answer, without a terminal, the three questions that matter: what is running, is
the last backup restorable, and what changed.

## Positioning

The panel is built around verification, not around status badges. Where a comparable panel shows
"healthy", this one shows what was checked and what failed: the backup run, the isolated restore,
the snapshot comparison and the cleanup, each with its own result. The claim a neighbouring panel
could not copy truthfully is that a deployment is only as good as its last verified restore — and
that the panel can prove it.

## Operating Context

- Installed on a VPS or home server, reached at `http://127.0.0.1:<port>` by default; exposing it
  to a LAN or the internet is an explicit decision the operator makes.
- Fully offline: no cloud account, no remote identity provider, no telemetry, no third-party
  request. The panel talks to the host it runs on.
- The engine is the authority for anything destructive. Every action returns a report the panel
  displays as-is rather than re-interpreting it.
- Competitors set the expected coverage: Coolify, Dokploy and Easypanel. Feature parity across
  deployment, databases and backups is the target; the panel must not feel like a thin viewer.

## Capabilities and Constraints

**Staged delivery, full ambition.** Coverage grows in three stages, and each stage ships behind a
working interface rather than a disabled button:

1. Read-only: deployment status, backups list, backup verify, log tail, last restore report.
2. Backups: create a backup, verify, prune old bundles.
3. Lifecycle: deploy, restart, roll back, scale-adjacent operations — the Coolify-class surface.

**Accounts.** The first run creates the administrator on the host; there is no email, no
self-service signup and no remote recovery. A lost password is reset by removing the account record
on the server; there is no web reset.
Multiple users with roles (read vs operate) are required, and are added after the first account
exists.

**Hard constraints.** One Node 24 runtime, installed by `install.sh`; no Python, no separate
command line tool, no external service. Container work goes through Podman or Docker on the host.
State stays in the private state directory, and every destructive action is confirmed and
attributed.

**Terminology that must not drift.** "Deployment" (the app plus its PostgreSQL), "bundle" (a
backup directory), "verify" (the isolated restore and comparison), "report" (the structured answer
the engine returns). Never "project" for a deployment, never "snapshot" for a bundle.

## Brand Commitments

- The name is Enerthya Host, developed under Versune. Copy is English.
- The existing visual system is binding: white and near-black, Archivo for display and UI, IBM
  Plex Mono for labels, commands and data, hairline rules, sharp 2px corners, no shadows, no
  gradients, no glass.
- Mint is a semantic colour, not a brand wash: it may only mark a verified equality (`A = A`), a
  passing checksum or a confirmed verification row. It is never a button, heading or background.
- Honesty is part of the brand: no invented metrics, no fabricated output, no disabled control
  pretending to be a feature.

## Evidence on Hand

- The panel's own working surface: first-run setup, sign-in, session and runtime detection.
- No deployment, backup or restore report exists in this codebase yet. Any panel imagery or copy
  about recovery must come from a real run once the engine exists, never from a mock-up presented
  as product.

## Product Principles

1. **The report is the interface.** Show what was checked, not a synthesised verdict.
2. **The engine stays authoritative.** The panel shows the engine's own report; it never invents a
   second truth.
3. **Local by default.** Loopback bind, local accounts, no third-party request — exposure is a
   decision the operator makes.
4. **Stages ship working.** Read-only means read-only and complete, not a placeholder for actions.
5. **Solo first, team when asked.** One administrator must be a finished state, not an unfinished
   multi-user system.

## Accessibility & Inclusion

Keyboard-first operation, visible focus on every control, 4.5:1 body contrast, status never carried
by colour alone, and no interaction that depends on hover. Forms are labelled and errors are
announced.
