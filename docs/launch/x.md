# X / Twitter launch kit

Assets in this folder:

- `x-avatar-512.png` — profile picture (512×512, dark canvas, ink mark)
- `x-banner-1500x500.png` — header (1500×500)

## 1. Retiring the old account

This cannot be done from the repository, and I cannot log into X for you. X requires the account's
own session; there is no API path for deleting an account that is not already authenticated.

1. **Export first.** Settings → Your account → Your data → Download an archive. Keep it even if the
   old account has nothing worth keeping.
2. **Check the handle.** X does not transfer a handle between accounts. Deactivating frees the
   username only after the 30-day window, and X may still hold it. If the old handle is the one you
   want, do not deactivate until the new account exists with a temporary handle and you have
   confirmed the old one can be released.
3. **Deactivate.** Settings → Your account → Deactivate account. The account disappears immediately
   but stays recoverable for 30 days; logging in during that window cancels the deletion.
4. **Wait out the window** before trying to claim the freed handle. Do not reuse the old account's
   email on the new one if you want the deletion to complete cleanly.

## 2. Creating the new account

- Use a project email, not a personal one; turn on 2FA and store the recovery codes.
- Handle candidates, in order: `@enerthyahost`, `@enerthya_host`, `@enerthya`. Availability is only
  authoritative at sign-up; several may be held by squatters.
- **Name:** Enerthya Host
- **Bio (152 characters):**
  `Open-source, self-hosted PaaS. Your servers, your deploys, your data — built around restores you can verify. Apache-2.0. Early build.`
- **Location:** Your hardware
- **Website:** `https://github.com/Versune/enerthya-host`
- **Avatar / banner:** the two PNGs in this folder.

## 3. Pinned post

> Enerthya Host is now public as an early build: an open-source, self-hosted PaaS in the Coolify
> class, built around one claim — a deployment is only as good as its last verified restore.
>
> Auth, organizations and the database foundation ship today. Deploys and verified backups are next.
> Apache-2.0.
>
> github.com/Versune/enerthya-host

## 4. Thread

1. **What it is.** A PaaS you run on your own servers: connect a machine, point at a repo or an
   image, and the platform owns build, deploy, domain, TLS, logs, backups and monitoring. No cloud
   account, no telemetry.
2. **What ships today.** The panel, email/password accounts with organizations, the full Postgres
   schema (18 tables), and a dark interface. Nothing deploys yet, and the README says so.
3. **The claim.** Panels show "healthy". We want to show what was checked — the backup run, the
   isolated restore, the comparison, the cleanup. A status badge is a promise; a verified restore
   is evidence.
4. **The stack.** Next.js 16 and a separate BullMQ worker, Postgres with Drizzle, better-auth,
   Podman or Docker on the host, Caddy or Traefik for TLS. Apache-2.0.
5. **Where to look.** github.com/Versune/enerthya-host — issues and challenges welcome, especially
   from people who have restored a backup under pressure.

## 5. Guardrails

- Do not claim deploys, domains, backups or restores work. They do not.
- Keep the visuals paper-and-ink; mint is reserved for a verified result and must not appear in a
  launch graphic.
- English copy only, matching the panel.
