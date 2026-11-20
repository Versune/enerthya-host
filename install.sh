#!/usr/bin/env bash
# Install the Enerthya Host panel.
#
#   curl -fsSL https://raw.githubusercontent.com/Versune/enerthya-host/main/install.sh | bash
#   install.sh --check                  # report this host, install nothing
#   install.sh --version v0.1.0         # a specific release
#   install.sh --from-source <dir>      # build a checkout instead
#
# The panel is a Node application. This script decides whether the host can run
# it, installs a verified release build, and prints how to start it.
set -euo pipefail

REPO="Versune/enerthya-host"
HOME_DIR="${ENERTHYA_HOME:-$HOME/.local/share/enerthya-host}"
VERSION=""
SOURCE_DIR=""
CHECK_ONLY=0

usage() {
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="${2:-}"; shift 2 ;;
    --from-source) SOURCE_DIR="${2:-}"; shift 2 ;;
    --check) CHECK_ONLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1" >&2; exit 2; }; }

# ---- operating system matrix ---------------------------------------------
# Containers reach a kernel natively on Linux and inside a VM everywhere else.
# This is the only place that decides; keep it in sync with README.md.
detect_os() {
  case "$(uname -s)" in
    Linux*)                echo "linux" ;;
    Darwin*)               echo "macos" ;;
    MINGW*|MSYS*|CYGWIN*)  echo "windows" ;;
    *)                     echo "unknown" ;;
  esac
}

os="$(detect_os)"
case "$os" in
  linux)
    os_label="Linux"
    os_note="containers run on this kernel; rootless is available"
    ;;
  macos)
    os_label="macOS"
    os_note="containers run inside Docker Desktop or colima; rootless is rootless inside that VM"
    ;;
  windows)
    os_label="Windows"
    os_note="run this inside WSL2; containers run in Docker Desktop's VM"
    ;;
  *)
    echo "Unsupported operating system: $(uname -s). Supported: Linux, macOS, Windows (WSL2)." >&2
    exit 2
    ;;
esac

runtime_state() {
  name="$1"; minimum="$2"
  command -v "$name" >/dev/null 2>&1 || { echo "not-installed"; return; }
  found="$("$name" --version 2>/dev/null | head -1 | grep -o '[0-9][0-9.]*' | head -1)"
  [ -n "$found" ] || { echo "unknown"; return; }
  if node -e '
      const a = process.argv[1].split(".").map(Number);
      const b = process.argv[2].split(".").map(Number);
      const pad = (v) => [v[0] || 0, v[1] || 0, v[2] || 0];
      const [x, y] = [pad(a), pad(b)];
      process.exit((x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]) >= 0 ? 0 : 1);
    ' "$found" "$minimum" 2>/dev/null; then
    echo "ready:$found"
  else
    echo "old:$found"
  fi
}

need node
node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 24 ]; then
  echo "Node 24 or newer is required (found $(node -v))." >&2
  exit 2
fi

podman_state="$(runtime_state podman 4.9.0)"
docker_state="$(runtime_state docker 24.0.0)"

report_runtime() {
  label="$1"; state="$2"; minimum="$3"
  case "$state" in
    ready:*)       echo "  $label$(printf '%*s' $((12 - ${#label})) '')${state#ready:} · ready" ;;
    old:*)         echo "  $label$(printf '%*s' $((12 - ${#label})) '')${state#old:} · older than $minimum" ;;
    not-installed) echo "  $label$(printf '%*s' $((12 - ${#label})) '')not installed" ;;
    *)             echo "  $label$(printf '%*s' $((12 - ${#label})) '')installed, version unknown" ;;
  esac
}

echo "Environment"
echo "  OS$(printf '%*s' 10 '')$os_label — $os_note"
report_runtime "Podman" "$podman_state" "4.9"
report_runtime "Docker" "$docker_state" "24"

if [ "${podman_state%%:*}" != "ready" ] && [ "${docker_state%%:*}" != "ready" ]; then
  echo >&2
  echo "No usable container runtime found." >&2
  echo "The panel opens without one, but it cannot host anything until Podman 4.9+" >&2
  echo "or Docker 24+ is installed on this machine." >&2
fi

if [ "$CHECK_ONLY" = "1" ]; then
  if [ "${podman_state%%:*}" = "ready" ] || [ "${docker_state%%:*}" = "ready" ]; then
    exit 0
  fi
  exit 1
fi

# ---- install --------------------------------------------------------------
need curl
if [ -z "$SOURCE_DIR" ] && [ -z "$VERSION" ]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
    | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)"
  [ -n "$VERSION" ] || { echo "could not resolve the latest release; pass --version" >&2; exit 2; }
fi

TARGET="$HOME_DIR/${VERSION:-source-$(date +%Y%m%d%H%M%S)}"
mkdir -p "$HOME_DIR"
rm -rf "$TARGET"
mkdir -p "$TARGET"

if [ -n "$SOURCE_DIR" ]; then
  need npm
  [ -f "$SOURCE_DIR/package.json" ] || { echo "no package.json in $SOURCE_DIR" >&2; exit 2; }
  ( cd "$SOURCE_DIR" && npm ci --no-audit --no-fund && npm run build )
  cp -a "$SOURCE_DIR/.next/standalone/." "$TARGET/"
  mkdir -p "$TARGET/.next"
  cp -a "$SOURCE_DIR/.next/static" "$TARGET/.next/static"
  cp -a "$SOURCE_DIR/public" "$TARGET/public"
  echo "Built the panel from $SOURCE_DIR."
else
  need sha256sum
  need tar
  BASE="https://github.com/$REPO/releases/download/$VERSION"
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  ASSET="enerthya-host-$VERSION.tar.gz"
  curl -fsSL "$BASE/$ASSET" -o "$TMP/$ASSET"
  curl -fsSL "$BASE/SHA256SUMS" -o "$TMP/SHA256SUMS"
  ( cd "$TMP" && grep " $ASSET\$" SHA256SUMS | sha256sum --check --status - ) || {
    echo "checksum verification failed for $ASSET" >&2
    exit 1
  }
  tar -xzf "$TMP/$ASSET" -C "$TARGET" --strip-components=1
  echo "Installed $ASSET and verified its checksum."
fi

ln -sfn "$TARGET" "$HOME_DIR/current"

cat <<EOF

Panel installed at $HOME_DIR/current

  ENERTHYA_STATE_DIR=~/.enerthya-state PORT=8420 node "$HOME_DIR/current/server.js"

It binds 127.0.0.1 and serves the panel at http://127.0.0.1:8420/.
EOF
