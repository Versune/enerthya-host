# Enerthya Host — working notes for Claude

## What this is

A self-hosted hosting panel. One machine, the applications it hosts, and a recovery path you can
verify instead of trusting. The panel is the product: there is no CLI, no Python runtime and no
separate agent process. Container work goes through Podman or Docker on the host.

Rivals are Coolify, Dokploy and Easypanel. The difference this project is built around is
**verification**: a deployment is only as good as its last restore that was actually checked, and
the panel shows what was checked rather than a status badge.

Early build. Authentication and runtime detection exist. Deployments, backups, verification and
restore do not exist yet. Never write copy or UI that implies they do.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict, `output: "standalone"`.
- No build step on the user's host beyond running `server.js`.
- Static assets and fonts are self-hosted; **zero third-party requests** at runtime.
- `install.sh` installs the standalone build, verifies release checksums, and carries the OS matrix.

## Commands

```sh
npm ci                 # install
npm run dev            # http://localhost:3000
npm run typecheck      # tsc --noEmit (must pass before any commit)
npm run build          # standalone build in .next/standalone
npm start              # run the standalone server
./install.sh --check   # report OS + container runtime, install nothing
./install.sh --from-source "$PWD"
```

Environment: `PORT` (8420), `HOSTNAME` (127.0.0.1), `ENERTHYA_STATE_DIR` (.enerthya-state),
`ENERTHYA_PANEL_SECURE=1` when behind TLS.

## Layout

```
app/                 pages: `/` (sign in / signed in), `/setup` (first run)
app/api/             health, runtime, setup, login, logout, session
components/          AuthScreen, AuthForm, Notice, SignOut, Brand
lib/accounts.ts      the single local administrator (scrypt, no recovery)
lib/session.ts       signed cookie + origin check
lib/runtime.ts       Podman/Docker detection and the OS boundary
DESIGN.md            the design system (binding)
PRODUCT.md           product truth and confirmed decisions
install.sh           installer + OS matrix
```

State directory (0700, files 0600): `panel-account.json` (salt, scrypt params, digest — never the
password) and `panel-session.key` (cookie signing key).

## Security invariants — do not weaken

- Passwords are never stored, logged, echoed into a response, or put in a URL.
- scrypt N=2^15, r=8, p=1, 32-byte key, 16-byte salt; parameters are stored with the record so old
  records verify with the parameters they were made with.
- Verification is constant-time, and a missing account costs the same work as a wrong password.
- Session cookie: HttpOnly, SameSite=Strict, 8 h, signed with a 0600 key.
- Every state-changing route calls `sameOrigin()`; a missing Origin is a refusal, not a pass.
- The server binds loopback. Exposing it is the operator's decision, never a default.
- No telemetry, no analytics, no external font or script.
- There is no web password reset. Reset means deleting the account record on the host.

## Design rules

`DESIGN.md` is binding: paper and ink, hairlines, underline fields, 2px corners, no shadows, no
gradients. Mistake to avoid: **mint (#34d399 / #06704d) only marks a verified equality** — never a
button, heading, background or success toast. On the auth surfaces mint does not appear at all.

Copy is English, technical, and states what is true. A refusal keeps the engine's own wording; a
missing capability says so instead of showing a disabled control.

## Product decisions already made

- The panel is the only interface. Do not reintroduce a CLI or a Python sidecar.
- First run creates the single administrator; team accounts and roles come later.
- One account per install; reset from the host by deleting `panel-account.json`.
- OS matrix: Linux native (Podman 4.9+ or Docker 24+); macOS and Windows (WSL2) run containers
  inside the runtime's VM, and the UI must say "VM", never "rootless on the host".
- Coverage ambition matches Coolify-class panels, delivered in stages: read-only → backups →
  lifecycle. Each stage ships working, not as a placeholder.

## Roadmap, in order

1. Dashboard after sign-in (the signed-in screen is currently a session summary only).
2. Runtime-aware status: what the host has, what is deployed, what is degraded.
3. Deployments: create, start, stop, logs.
4. Backups + verify (the differentiator); restore into isolated resources with a report.
5. Team accounts and roles.

## CI and repository

- `main` is the default branch; changes land through PRs (see `.github/pull_request_template.md`).
- `CI` runs install, typecheck and build.
- CodeQL uses **GitHub's default setup** (configured for `actions` and, once the reconfiguration
  finished, `javascript-typescript`). Do **not** add `.github/workflows/codeql.yml`: an advanced
  configuration cannot upload alongside the default setup.
- Dependabot updates npm and Actions weekly and groups dev minors.
- `.github` holds issue forms, the PR template and Dependabot config.

## Things that burned us

- A marketing site was built and discarded before this repository: the product opens into the
  panel, not into a landing page.
- The previous product was a Python CLI; its code is archived outside this repo. Do not copy
  behavior from it without re-verifying.
- Tool folders (`.impeccable/`) must not be committed; design documents live at the repository
  root as `DESIGN.md` and `PRODUCT.md`.
