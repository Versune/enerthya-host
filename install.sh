#!/usr/bin/env bash
# Install Enerthya Host on Linux (or WSL2 on Windows), the Coolify way: one
# script, Docker only.
#
#   curl -fsSL https://raw.githubusercontent.com/Versune/enerthya-host/main/install.sh | sudo bash
#   install.sh --check                  # report the host, install nothing
#   install.sh --version v0.3.0         # pin a release
#   install.sh --bind 0.0.0.0 --port 8420
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
DATE="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$DATA_DIR/install-$DATE.log"

usage() { sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="${2:-}"; shift 2 ;;
    --bind) BIND="${2:-}"; shift 2 ;;
    --port) PORT="${2:-}"; shift 2 ;;
    --url) PUBLIC_URL="${2:-}"; shift 2 ;;
    --check) CHECK_ONLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

say() { printf '%s\n' "$*" | tee -a "$LOG_FILE"; }
step() { printf '\n== %s\n' "$*" | tee -a "$LOG_FILE"; }
fail() { printf 'ERROR: %s\n' "$*" | tee -a "$LOG_FILE" >&2; exit 2; }
have() { command -v "$1" >/dev/null 2>&1; }

[ "$(id -u)" = "0" ] || {
  have sudo || fail "Run as root (sudo) — Docker and /data need it."
  exec sudo -E bash "$0" "$@"
}

mkdir -p "$DATA_DIR"
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
if [ ! -f "$SOURCE/Dockerfile" ]; then
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  BASE="https://github.com/$REPO/releases/download/$VERSION"
  ASSET="enerthya-host-$VERSION.tar.gz"
  curl -fsSL "$BASE/$ASSET" -o "$TMP/$ASSET"
  curl -fsSL "$BASE/SHA256SUMS" -o "$TMP/SHA256SUMS"
  ( cd "$TMP" && grep " $ASSET\$" SHA256SUMS | sha256sum --check --status - ) ||
    fail "Checksum verification failed for $ASSET."
  say "  Checksum verified"
  rm -rf "$SOURCE"
  mkdir -p "$SOURCE"
  tar -xzf "$TMP/$ASSET" -C "$SOURCE" --strip-components=1
  rm -rf "$TMP"
  trap - EXIT
fi
ln -sfn "$SOURCE" "$DATA_DIR/current"

# ---- secrets ----------------------------------------------------------------
step "Writing environment"
gen_secret() { openssl rand -base64 32 | tr -d '\n'; }
if [ -f "$ENV_FILE" ]; then
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

cat >"$ENV_FILE" <<EOF
# Generated by install.sh. Contains secrets; keep this file private.
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
BETTER_AUTH_URL=$PUBLIC_URL
BETTER_AUTH_TRUSTED_ORIGINS=$TRUSTED
ENERTHYA_VERSION=$VERSION
ENERTHYA_BIND=$BIND
ENERTHYA_PORT=$PORT
EOF
chmod 600 "$ENV_FILE"

cp "$SOURCE/compose.yml" "$DATA_DIR/compose.yml"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$DATA_DIR/compose.yml")

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
  "${COMPOSE[@]}" exec -T postgres pg_isready -U enerthya -d enerthya >/dev/null 2>&1 && { READY=1; break; }
  sleep 2
done
[ "$READY" = "1" ] || fail "Postgres did not become ready. Check: ${COMPOSE[*]} logs postgres"

step "Applying migrations"
"${COMPOSE[@]}" exec -T postgres psql -U enerthya -d enerthya -v ON_ERROR_STOP=1 \
  -c "CREATE TABLE IF NOT EXISTS enerthya_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())" >/dev/null
for file in "$SOURCE"/drizzle/*.sql; do
  [ -f "$file" ] || continue
  base="$(basename "$file")"
  applied="$("${COMPOSE[@]}" exec -T postgres psql -U enerthya -d enerthya -tAc "SELECT 1 FROM enerthya_migrations WHERE filename = '$base'")"
  [ "$applied" = "1" ] && continue
  say "  $base"
  {
    echo "BEGIN;"
    cat "$file"
    echo "INSERT INTO enerthya_migrations (filename) VALUES ('$base');"
    echo "COMMIT;"
  } | "${COMPOSE[@]}" exec -T postgres psql -U enerthya -d enerthya -v ON_ERROR_STOP=1 >/dev/null
done

# ---- start and verify -------------------------------------------------------
step "Starting the panel"
"${COMPOSE[@]}" up -d panel
HEALTHY=0
for _ in $(seq 1 45); do
  code="$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/health" 2>/dev/null || true)"
  [ "$code" = "200" ] && { HEALTHY=1; break; }
  sleep 2
done
[ "$HEALTHY" = "1" ] || fail "The panel did not become healthy. Check: ${COMPOSE[*]} logs panel"

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
say "Upgrade: rerun this script (add --version to pin)."
say "Expose publicly only behind TLS; BETTER_AUTH_URL was set to $PUBLIC_URL."
