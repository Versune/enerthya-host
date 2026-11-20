# Enerthya Host

A self-hosted hosting panel. You install it on one machine, open it in the browser, and it
runs the applications and databases that machine hosts — with a recovery path you can verify
rather than trust.

Early build. The panel, its local account and container-runtime detection work; deployment,
backup and restore are the next stages and are not wired yet. Nothing here claims to host an
application until it can.

## Supported platforms

| Host | Containers run | Runtime | State |
|---|---|---|---|
| Linux | natively on the host kernel, rootless available | Podman 4.9+ or Docker 24+ | first class |
| macOS | inside Docker Desktop or colima's VM | Docker 24+ | supported, VM boundary |
| Windows (WSL2) | inside Docker Desktop's VM | Docker 24+ | supported, VM boundary |

`./install.sh --check` reports what the current machine has and installs nothing.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/Versune/enerthya-host/main/install.sh | bash
```

Or from a checkout, building locally:

```sh
./install.sh --from-source "$PWD"
```

Requirements: Node 24 or newer, plus Podman or Docker as shown above. The script verifies the
release checksum when it downloads a build.

## Run

```sh
ENERTHYA_STATE_DIR=~/.enerthya-state PORT=8420 node ~/.local/share/enerthya-host/current/server.js
```

Open `http://127.0.0.1:8420/`. The first visit creates the administrator; there is no email, no
cloud account and no recovery link — the password you set is the only way in, and resetting it
means removing the account file on the host.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8420` | Loopback port |
| `HOSTNAME` | `127.0.0.1` | Bind address; do not expose without TLS in front |
| `ENERTHYA_STATE_DIR` | `.enerthya-state` | Where the account and session key live (0700 dir, 0600 files) |
| `ENERTHYA_PANEL_SECURE` | unset | `1` marks the session cookie `Secure` behind TLS |

## What works now

- First-run administrator creation and sign-in, scrypt-hashed on this machine.
- HttpOnly, SameSite=Strict sessions signed with a key kept in the state directory.
- Container runtime detection: Podman and Docker, with the operating-system boundary stated.
- `/api/health` and `/api/runtime` expose exactly what the panel knows.

## What does not exist yet

- Creating, starting, stopping or updating an application.
- Backups, verification and restore.
- Team accounts and roles.
- Any network exposure story beyond "bind loopback and put TLS in front".

## Development

```sh
npm ci
npm run dev        # http://localhost:3000
npm run typecheck
npm run build      # standalone server in .next/standalone
npm start
```

Design decisions live in `DESIGN.md`; product truth lives in `PRODUCT.md`.

## Security

The panel is local: it binds `127.0.0.1`, keeps its account and session key in a private state
directory, sends nothing to a third party, and refuses cross-origin state-changing requests.
There is no rate limiting or lockout yet beyond the cost of scrypt.

## Licence

Apache-2.0. Developed under Versune.
