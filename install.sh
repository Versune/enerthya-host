#!/usr/bin/env bash
# Install Enerthya Host on Linux (or WSL2 on Windows), the Coolify way: one
# script, Docker only.
#
#   curl -fsSL https://raw.githubusercontent.com/Versune/enerthya-host/main/install.sh | sudo bash
#   install.sh --check                  # report the host, install nothing
#   install.sh --version v0.3.0         # pin a release
#   install.sh --bind 0.0.0.0 --port 8420
#   install.sh --with-runtime           # also run deploys (mounts the Docker socket)
#
# It installs Docker when missing, downloads and verifies the release, builds
# the panel image locally, starts Postgres + Redis + panel with Compose,
# applies migrations and waits for the healthcheck. State lives in
# /data/enerthya. Rerun the same command to upgrade.
set -euo pipefail

REPO="Versune/enerthya-host"
DATA_DIR="${ENERTHYA_HOME:-/data/enerthya}"
ENV_FILE="$DATA_DIR/.env"
VERSION=""
CHECK_ONLY=0
BIND="${ENERTHYA_BIND:-127.0.0.1}"
PORT="${ENERTHYA_PORT:-8420}"
PUBLIC_URL=""
WITH_RUNTIME=0
DATE="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$DATA_DIR/install-$DATE.log"

# The script is often piped into bash, where $0 is "bash": reading the header
# from the file would print nothing. The usage is carried here instead.
usage() {
  cat <<'USAGE'
Install Enerthya Host (Linux or WSL2), Docker only.

  install.sh                 install or upgrade to the latest release
  install.sh --version vX.Y.Z   pin a release
  install.sh --bind ADDR     host interface for the panel (default 127.0.0.1)
  install.sh --port N        host port for the panel (default 8420)
  install.sh --url URL       the origin users open; must match the browser URL
  install.sh --with-runtime  also run deploys (mounts the Docker socket)
  install.sh --check         report the host; install nothing

State lives in /data/enerthya. Rerunning the same command upgrades in place;
an upgrade that cannot start the new version leaves the previous one running.
USAGE
}

die() { printf 'ERROR: %s\n' "$*" >&2; exit 2; }

need_value() { [ -n "${2:-}" ] || die "$1 needs a value"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --version) need_value "$1" "${2:-}"; VERSION="$2"; shift 2 ;;
    --bind) need_value "$1" "${2:-}"; BIND="$2"; shift 2 ;;
    --port) need_value "$1" "${2:-}"; PORT="$2"; shift 2 ;;
    --url) need_value "$1" "${2:-}"; PUBLIC_URL="$2"; shift 2 ;;
    --check) CHECK_ONLY=1; shift ;;
    --with-runtime) WITH_RUNTIME=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1 (try --help)" ;;
  esac
done

say() { printf '%s\n' "$*" | tee -a "$LOG_FILE"; }
step() { printf '\n== %s\n' "$*" | tee -a "$LOG_FILE"; }
fail() { printf 'ERROR: %s\n' "$*" | tee -a "$LOG_FILE" >&2; exit 2; }
have() { command -v "$1" >/dev/null 2>&1; }

[ "$(id -u)" = "0" ] || {
  have sudo || die "Run as root (sudo) — Docker and /data need it."
  if [ -f "$0" ]; then
    exec sudo -E bash "$0" "$@"
  fi
  die "Run it as root: curl -fsSL .../install.sh | sudo bash"
}

mkdir -p "$DATA_DIR"
have flock || die "flock is required (util-linux)."
exec 9>"$DATA_DIR/.install.lock"
flock -n 9 || die "Another install is already running on this host ($DATA_DIR/.install.lock)."
: >"$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

# ---- distribution and packages --------------------------------------------
step "Detecting the operating system"
[ -r /etc/os-release ] || fail "Unsupported system: /etc/os-release is missing."
# shellcheck disable=SC1091
OS_ID="$(. /etc/os-release && echo "${ID:-unknown}")"
OS_LIKE="$(. /etc/os-release && echo "${ID_LIKE:-}")"
OS_VERSION="$(. /etc/os-release && echo "${VERSION_ID:-rolling}")"
say "  $OS_ID $OS_VERSION"

install_packages() {
  case " $OS_ID $OS_LIKE " in
    *" debian "*|*" ubuntu "*)
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -y
      apt-get install -y curl ca-certificates jq openssl tar gzip
      ;;
    *" fedora "*|*" rhel "*|*" centos "*|*" rocky "*|*" almalinux "*|*" amzn "*)
      (have dnf || yum install -y dnf)
      dnf install -y curl ca-certificates jq openssl tar gzip
      ;;
    *" arch "*|*" manjaro "*)
      pacman -Sy --noconfirm --needed curl ca-certificates jq openssl tar gzip
      ;;
    *" alpine "*)
      apk update && apk add curl ca-certificates jq openssl tar gzip
      ;;
    *" suse "*|*" opensuse "*)
      zypper --non-interactive refresh
      zypper --non-interactive install curl ca-certificates jq openssl tar gzip
      ;;
    *) fail "Unsupported distribution: $OS_ID. Install curl, jq, openssl and Docker manually." ;;
  esac
}

if ! have curl || ! have jq || ! have openssl; then
  step "Installing required packages"
  install_packages
fi
have curl || fail "curl is required."
have jq || fail "jq is required."

# ---- docker -----------------------------------------------------------------
docker_ready() { have docker && docker info >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; }

if [ "$CHECK_ONLY" = "1" ]; then
  say ""
  say "Docker:   $(have docker && docker --version || echo 'not installed')"
  say "Compose:  $(have docker && docker compose version 2>/dev/null || echo 'not installed')"
  say "Data dir: $DATA_DIR"
  docker_ready && exit 0 || exit 1
fi

install_docker() {
  step "Installing Docker"
  curl -fsSL https://get.docker.com | sh
  if have systemctl; then systemctl enable --now docker; fi
  if ! docker compose version >/dev/null 2>&1; then
    case " $OS_ID $OS_LIKE " in
      *" debian "*|*" ubuntu "*) apt-get install -y docker-compose-plugin ;;
      *" fedora "*|*" rhel "*|*" centos "*) dnf install -y docker-compose-plugin ;;
      *" arch "*) pacman -S --noconfirm --needed docker-compose ;;
      *" alpine "*) apk add docker-cli-compose ;;
    esac
  fi
}

if ! docker_ready; then
  install_docker
  have docker || fail "Docker could not be installed."
fi
docker_ready || fail "Docker is installed but the daemon or Compose is not reachable."
say "  $(docker --version)"

# ---- release ----------------------------------------------------------------
step "Downloading Enerthya Host"
if [ -z "$VERSION" ]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | jq -r .tag_name)"
  [ -n "$VERSION" ] && [ "$VERSION" != "null" ] || fail "No release found; pass --version."
fi
say "  Version $VERSION"

SOURCE="$DATA_DIR/source/$VERSION"
# A marker, not "does Dockerfile exist": an interrupted extraction left the
# Dockerfile behind and the next run skipped the checksum over a partial tree.
# Without the marker the artifact is downloaded and verified again.
if [ ! -f "$SOURCE/.verified" ]; then
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  BASE="https://github.com/$REPO/releases/download/$VERSION"
  ASSET="enerthya-host-$VERSION.tar.gz"
  # A release exists the moment its tag does; the artifact is attached by a
  # later workflow. Running the installer in that window used to fail with a
  # bare 404, so the download retries and explains itself if it still cannot.
  curl -fsSL --retry 6 --retry-delay 5 --retry-all-errors "$BASE/$ASSET" -o "$TMP/$ASSET" ||
    fail "Could not download $ASSET. If this release was just published, its artifact may still be uploading; retry in a minute."
  curl -fsSL --retry 6 --retry-delay 5 --retry-all-errors "$BASE/SHA256SUMS" -o "$TMP/SHA256SUMS" ||
    fail "Could not download SHA256SUMS for $VERSION."
  ( cd "$TMP" && grep " $ASSET\$" SHA256SUMS | sha256sum --check --status - ) ||
    fail "Checksum verification failed for $ASSET."
  say "  Checksum verified"
  mkdir -p "$TMP/unpacked"
  tar -xzf "$TMP/$ASSET" -C "$TMP/unpacked" --strip-components=1
  for path in Dockerfile compose.yml drizzle apps/web/server.js apps/worker/dist/index.cjs; do
    [ -e "$TMP/unpacked/$path" ] || fail "$ASSET is missing $path"
  done
  rm -rf "$SOURCE"
  mkdir -p "$(dirname "$SOURCE")"
  mv "$TMP/unpacked" "$SOURCE"
  touch "$SOURCE/.verified"
  rm -rf "$TMP"
  trap - EXIT
fi
ln -sfn "$SOURCE" "$DATA_DIR/current"

# ---- secrets ----------------------------------------------------------------
step "Writing environment"
gen_secret() { openssl rand -base64 32 | tr -d '\n'; }
# Settings an operator added by hand (S3 credentials today, anything ENERTHYA_*
# later) are not written by this script, so they are carried over explicitly.
# Without this, every upgrade silently dropped ENERTHYA_S3_* and backups went
# back to local-only storage.
PRESERVED_ENV=""
if [ -f "$ENV_FILE" ]; then
  PRESERVED_ENV="$(grep -E '^ENERTHYA_[A-Z0-9_]+=' "$ENV_FILE" 2>/dev/null |
    grep -vE '^ENERTHYA_(VERSION|BIND|PORT|HOME)=' || true)"
  cp -p "$ENV_FILE" "$ENV_FILE.bak-$DATE"
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi
[ -n "${POSTGRES_PASSWORD:-}" ] || POSTGRES_PASSWORD="$(openssl rand -hex 24)"
[ -n "${BETTER_AUTH_SECRET:-}" ] || BETTER_AUTH_SECRET="$(gen_secret)"
[ -n "${ENCRYPTION_KEY:-}" ] || ENCRYPTION_KEY="$(gen_secret)"

PRIMARY_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
[ -n "$PUBLIC_URL" ] || PUBLIC_URL="http://${BIND/0.0.0.0/$PRIMARY_IP}:$PORT"
TRUSTED="http://127.0.0.1:$PORT,http://localhost:$PORT"
[ -n "$PRIMARY_IP" ] && TRUSTED="$TRUSTED,http://$PRIMARY_IP:$PORT"
[ -n "$PUBLIC_URL" ] && TRUSTED="$TRUSTED,$PUBLIC_URL"

# An upgrade without --with-runtime must not switch deploys off: the profile is
# carried over from the existing .env. Turning it off stays a deliberate edit of
# that file, as docs/install.md describes. Before this, every upgrade silently
# rewrote COMPOSE_PROFILES as empty and left the worker on the previous image.
if [ "$WITH_RUNTIME" = "1" ]; then
  PROFILES=runtime
else
  PROFILES="${COMPOSE_PROFILES:-}"
fi
# Profiles decide whether the worker and proxy run, not the flag: an upgrade
# that keeps the profile must also refresh the containers it starts.
case ",$PROFILES," in
  *,runtime,*) RUNTIME_ENABLED=1 ;;
  *) RUNTIME_ENABLED=0 ;;
esac

# Written beside the live one and moved into place only after the new image has
# answered; until then the running install keeps its own environment.
NEW_ENV="$ENV_FILE.new-$DATE"
cat >"$NEW_ENV" <<EOF
# Generated by install.sh. Contains secrets; keep this file private.
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
BETTER_AUTH_URL=$PUBLIC_URL
BETTER_AUTH_TRUSTED_ORIGINS=$TRUSTED
ENERTHYA_VERSION=$VERSION
ENERTHYA_BIND=$BIND
ENERTHYA_PORT=$PORT
COMPOSE_PROFILES=$PROFILES
EOF
[ -n "$PRESERVED_ENV" ] && printf '%s\n' "$PRESERVED_ENV" >>"$NEW_ENV"
chmod 600 "$NEW_ENV"
COMPOSE=(docker compose --env-file "$NEW_ENV" -f "$SOURCE/compose.yml")

# ---- image ------------------------------------------------------------------
step "Building the panel image"
docker build -t "enerthya-host:$VERSION" -f "$SOURCE/Dockerfile" "$SOURCE" >/dev/null
docker tag "enerthya-host:$VERSION" enerthya-host:latest
say "  enerthya-host:$VERSION"

# ---- database and migrations ------------------------------------------------
step "Starting Postgres and Redis"
"${COMPOSE[@]}" up -d postgres redis
READY=0
for _ in $(seq 1 60); do
  "${COMPOSE[@]}" exec -T postgres pg_isready -U enerthya -d enerthya </dev/null >/dev/null 2>&1 && { READY=1; break; }
  sleep 2
done
[ "$READY" = "1" ] || fail "Postgres did not become ready. Check: ${COMPOSE[*]} logs postgres"

step "Applying migrations"
"${COMPOSE[@]}" exec -T postgres psql -U enerthya -d enerthya -v ON_ERROR_STOP=1 </dev/null \
  -c "CREATE TABLE IF NOT EXISTS enerthya_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())" >/dev/null
for file in "$SOURCE"/drizzle/*.sql; do
  [ -f "$file" ] || continue
  base="$(basename "$file")"
  applied="$("${COMPOSE[@]}" exec -T postgres psql -U enerthya -d enerthya -tAc "SELECT 1 FROM enerthya_migrations WHERE filename = '$base'" </dev/null)"
  [ "$applied" = "1" ] && continue
  say "  $base"
  {
    echo "BEGIN;"
    cat "$file"
    echo "INSERT INTO enerthya_migrations (filename) VALUES ('$base');"
    echo "COMMIT;"
  } | "${COMPOSE[@]}" exec -T postgres psql -U enerthya -d enerthya -v ON_ERROR_STOP=1 >/dev/null
done

# ---- preflight ---------------------------------------------------------------
# The image is proven before the switch: started on a spare loopback port, with
# the same environment and the migrated database. A version that cannot boot
# never replaces one that is serving.
step "Checking the new image before switching"
PROBE_PORT=""
for candidate in $(seq 18420 18520); do
  if ! (exec 3<>"/dev/tcp/127.0.0.1/$candidate") 2>/dev/null; then
    PROBE_PORT="$candidate"
    break
  fi
done
[ -n "$PROBE_PORT" ] || fail "no free loopback port for the pre-flight check"
PROBE_ID="$(docker run -d --rm --name "enerthya-probe-$DATE" --network host \
  --env-file "$NEW_ENV" \
  -e PORT="$PROBE_PORT" -e HOSTNAME=127.0.0.1 \
  -e "DATABASE_URL=postgres://enerthya:$POSTGRES_PASSWORD@127.0.0.1:${POSTGRES_PORT:-5432}/enerthya" \
  "enerthya-host:$VERSION")"
PROBE_OK=0
for _ in $(seq 1 30); do
  probe_code="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PROBE_PORT/api/health" 2>/dev/null || true)"
  [ "$probe_code" = "200" ] && { PROBE_OK=1; break; }
  sleep 2
done
docker rm -f "$PROBE_ID" >/dev/null 2>&1 || true
[ "$PROBE_OK" = "1" ] ||
  fail "the new image did not answer /api/health; the running install was left untouched"
say "  $VERSION answers /api/health"

# ---- switch -----------------------------------------------------------------
step "Starting the panel"
PREVIOUS=""
if [ -f "$ENV_FILE.bak-$DATE" ]; then
  PREVIOUS="$(grep -E '^ENERTHYA_VERSION=' "$ENV_FILE.bak-$DATE" | cut -d= -f2- || true)"
fi
mv "$NEW_ENV" "$ENV_FILE"
chmod 600 "$ENV_FILE"
cp "$SOURCE/compose.yml" "$DATA_DIR/compose.yml"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$DATA_DIR/compose.yml")
"${COMPOSE[@]}" up -d panel

if [ "$RUNTIME_ENABLED" = "1" ]; then
  step "Starting the deploy runtime"
  say "  The worker mounts /var/run/docker.sock: anyone who controls it controls this host."
  "${COMPOSE[@]}" up -d worker
  # The proxy serves domains. It needs :80 and :443; if something else owns
  # them, the panel and the worker are still worth starting.
  "${COMPOSE[@]}" up -d proxy ||
    say "  The proxy did not start — is 80 or 443 in use? Domains will not be served until it does."
fi
HEALTHY=0
for _ in $(seq 1 45); do
  code="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/health" 2>/dev/null || true)"
  [ "$code" = "200" ] && { HEALTHY=1; break; }
  sleep 2
done
if [ "$HEALTHY" != "1" ]; then
  if [ -n "$PREVIOUS" ]; then
    cp -p "$ENV_FILE.bak-$DATE" "$ENV_FILE"
    "${COMPOSE[@]}" up -d panel >/dev/null 2>&1 || true
    if [ "$RUNTIME_ENABLED" = "1" ]; then
      "${COMPOSE[@]}" up -d worker >/dev/null 2>&1 || true
      "${COMPOSE[@]}" up -d proxy >/dev/null 2>&1 || true
    fi
    fail "$VERSION did not become healthy; rolled back to $PREVIOUS"
  fi
  fail "The panel did not become healthy. Check: ${COMPOSE[*]} logs panel"
fi

PUBLIC_IP="$(curl -4fsS --max-time 5 https://ifconfig.io 2>/dev/null || true)"

say ""
say "Enerthya Host $VERSION is running."
if [ "$BIND" = "0.0.0.0" ] && [ -n "$PUBLIC_IP" ]; then
  say "  Panel    http://$PUBLIC_IP:$PORT"
else
  say "  Panel    http://127.0.0.1:$PORT"
fi
[ -n "$PRIMARY_IP" ] && say "  Private  http://$PRIMARY_IP:$PORT"
say "  Data     $DATA_DIR"
say "  Env      $ENV_FILE (0600)"
say "  Compose  $DATA_DIR/compose.yml"
say "  Log      $LOG_FILE"
say ""
if [ "$RUNTIME_ENABLED" = "1" ]; then
  say "  Deploys  enabled (worker has the Docker socket)"
else
  say "  Deploys  disabled — rerun with --with-runtime to let the worker start containers."
fi
if [ -f "$ENV_FILE.bak-$DATE" ]; then say "  Backup   $ENV_FILE.bak-$DATE"; fi
say ""
say "Services"
"${COMPOSE[@]}" ps --format '  {{.Service}}  {{.Status}}' 2>/dev/null || true
say ""
say "Upgrade: rerun this script (add --version to pin)."
say "Expose publicly only behind TLS; BETTER_AUTH_URL was set to $PUBLIC_URL."
