# Installing Enerthya Host

The panel runs as two containers, the panel itself and Postgres 17 and Redis 7 alongside it.
Nothing else is installed on the host except Docker. A fourth container, the deploy worker, is
optional and described under [Running deploys](#running-deploys).

## Requirements

| Host | Containers | Installer |
|---|---|---|
| Linux (Debian/Ubuntu, Fedora/RHEL/Rocky/Alma, Arch, Alpine, openSUSE) | native | `install.sh` |
| macOS | Docker Desktop or colima VM | `install.sh` inside Docker |
| Windows 10/11 | Docker Desktop WSL2 backend | `install.sh` inside WSL2 |

Minimum: 2 GB RAM, 10 GB disk, Docker 24+ with Compose v2. The panel itself uses little; Postgres
and any future databases dominate the disk.

## Linux

```sh
curl -fsSL https://raw.githubusercontent.com/Versune/enerthya-host/main/install.sh | sudo bash
```

The script is idempotent: rerunning it upgrades the panel and keeps the data volumes and secrets.
Flags:

| Flag | Meaning |
|---|---|
| `--check` | print OS, Docker and data dir; install nothing |
| `--version v0.3.0` | pin a release instead of latest |
| `--bind 0.0.0.0` | listen on every interface (see TLS below) |
| `--port 8420` | panel port |
| `--url https://panel.example.com` | origin used by better-auth; set it when not using localhost |
| `--with-runtime` | also run the deploy worker (mounts the Docker socket — see below) |

Layout:

```
/data/enerthya/
  .env               secrets, version, bind and port (0600)
  compose.yml        generated stack
  source/<version>/  verified release, Dockerfile and migrations
  current -> source/<version>
  install-*.log      full installer log
```

## Windows (WSL2)

Install Docker Desktop with the WSL2 backend, open a WSL2 terminal and run the Linux command. The
stack is Linux containers; Docker Desktop exposes the panel port to Windows automatically at
`http://localhost:8420`. State lives in the WSL2 distro's `/data/enerthya`.

## macOS

Install Docker Desktop or colima and run the same command inside the Docker VM. State lives in
`/data/enerthya` inside that VM; back it up from there.

## Environment

| Key | Meaning |
|---|---|
| `POSTGRES_PASSWORD` | generated; also embedded in `DATABASE_URL` inside Compose |
| `BETTER_AUTH_SECRET` | generated 32-byte secret |
| `ENCRYPTION_KEY` | generated 32-byte key for AES-256-GCM |
| `BETTER_AUTH_URL` | origin users open; must match the browser URL |
| `BETTER_AUTH_TRUSTED_ORIGINS` | comma-separated extra origins (LAN IP, domain) |
| `ENERTHYA_VERSION` | image tag to run |
| `ENERTHYA_BIND` | host interface for the panel port |
| `ENERTHYA_PORT` | host port for the panel |
| `ENERTHYA_S3_ENDPOINT` | S3-compatible endpoint for verified backups (S3, R2, MinIO) |
| `ENERTHYA_S3_BUCKET` | bucket that receives the dumps |
| `ENERTHYA_S3_REGION` | region; `auto` for R2 (default) |
| `ENERTHYA_S3_ACCESS_KEY_ID` | access key |
| `ENERTHYA_S3_SECRET_ACCESS_KEY` | secret key |
| `ENERTHYA_SMTP_HOST` | SMTP relay for email notifications |
| `ENERTHYA_SMTP_PORT` | relay port; 587 (STARTTLS) by default, 465 implies implicit TLS |
| `ENERTHYA_SMTP_USER` | relay user, when the relay needs one |
| `ENERTHYA_SMTP_PASSWORD` | relay password |
| `ENERTHYA_SMTP_FROM` | envelope sender, e.g. `Enerthya <panel@example.com>` |

The worker container receives these values; a key left empty is a feature switched off, not a
crash.

With the five `ENERTHYA_S3_*` values set, a verified backup is uploaded and the local copy is
removed; the row records `s3://<bucket>/<key>`. Without them the dump stays in the `backups`
volume (`enerthya_backups`), which survives recreating and upgrading the worker — but lives on
the same host as the database it protects, so it covers a bad deploy, not a lost machine. Set the
S3 values for anything you mean to keep.

Email uses one relay for the whole install: deployment notices and team invitations both leave
through it. With `ENERTHYA_SMTP_HOST` and `ENERTHYA_SMTP_FROM` set, an invited address receives
the invitation link and an email channel receives the deployment-failure notice. Without them
the panel still creates the invitation and shows the link on the Members screen, and the worker
logs that it skipped the send.

A working invitation relay, for reference:

```sh
ENERTHYA_SMTP_HOST=smtp.example.com
ENERTHYA_SMTP_PORT=587
ENERTHYA_SMTP_USER=panel@example.com
ENERTHYA_SMTP_PASSWORD=the-relay-password
ENERTHYA_SMTP_FROM=Enerthya Host <panel@example.com>
```

Back up `.env` with the data volumes: without `ENCRYPTION_KEY`, secrets stored in the database
cannot be decrypted.

## Running deploys

By default the panel installs **without** the worker: applications can be created and deployments
are recorded, but nothing builds or starts a container. That is deliberate — the worker needs
`/var/run/docker.sock`, and a mounted socket is equivalent to root on the host.

To enable deploys:

```sh
sudo bash install.sh --with-runtime
```

This writes `COMPOSE_PROFILES=runtime` to `.env` and starts two services:

- it runs the same image with `command: ["node", "apps/worker/dist/index.cjs"]`;
- it mounts `/var/run/docker.sock` and uses host networking, because the containers it starts
  publish their ports on the host's loopback;
- Postgres and Redis are published on `127.0.0.1` only, for the worker to reach them;
- the **`proxy`** service (Caddy) takes `:80` and `:443` on the host, routes each domain the panel
  knows about to the port its deployment published, and obtains the certificate itself.

Both bind ports on the host, so stop anything already listening on 80 or 443 before enabling the
profile. A domain only works after its DNS record points at this machine and a deployment has
reached `running`.

Anyone able to execute a container through that socket can mount the host's filesystem and read
every secret on the machine, including `/data/enerthya/.env`. Run the worker only on a host you
control, and treat the panel as having that privilege too.

Turn it off again by removing `COMPOSE_PROFILES` from `.env` and running
`docker compose ... up -d --remove-orphans` — deployments then queue until a worker exists.

## Exposing it on a VPS

Default is loopback. For a domain, terminate TLS in Caddy, Traefik or nginx and proxy to
`127.0.0.1:8420`, then reinstall with `--url https://panel.example.com` so the session cookie and
redirects use the public origin. Opening the port directly with `--bind 0.0.0.0` works for a quick
test but sends credentials over plain HTTP.

## Upgrade and uninstall

- Upgrade: rerun the installer (add `--version` to pin). Migrations apply before the new panel
  starts; the previous image stays tagged on disk.
- Uninstall: `docker compose --env-file /data/enerthya/.env -f /data/enerthya/compose.yml down`
  removes the containers but keeps the volumes; add `-v` to delete the data. Remove
  `/data/enerthya` for a full reset.

## Troubleshooting

| Symptom | Check |
|---|---|
| Panel unhealthy | `docker compose --env-file /data/enerthya/.env -f /data/enerthya/compose.yml logs panel` |
| Postgres not ready | `... logs postgres`; port conflicts inside Compose do not touch the host |
| Login redirects to the wrong host | `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` in `.env` |
| Docker permission denied | the installer uses root; for manual runs add your user to the `docker` group |
| Deploy stays `queued` | no worker is running: reinstall with `--with-runtime` |
| Worker restarts on boot | `docker compose ... logs worker`; the socket must exist at that path |
