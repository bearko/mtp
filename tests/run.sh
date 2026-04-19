#!/usr/bin/env bash
# @spec SPEC-036 §5 全テストの一括実行
#
# 使い方:
#   ./tests/run.sh             # unit + integration + scenario 全部
#   ./tests/run.sh unit        # 単体テストだけ
#   ./tests/run.sh integration # 結合テストだけ
#   ./tests/run.sh scenario    # シナリオテストだけ
#   ./tests/run.sh unit scenario  # 複数指定可
#
# integration / scenario は http サーバを必要とするため、未起動なら自動で立ち上げる。

set -u

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$TESTS_DIR/.." && pwd)"
PROTOTYPE_DIR="$REPO_ROOT/prototype"

# @spec SPEC-036 §5 puppeteer-core の解決先
#   環境側に既にあるなら NODE_PATH を引き継ぎ、無ければ /tmp/node_modules / /usr/lib/node_modules を追加
if [ -z "${NODE_PATH:-}" ]; then
  if [ -d "/tmp/node_modules" ]; then
    export NODE_PATH="/tmp/node_modules"
  fi
fi

# 引数なしは全部
LAYERS=("$@")
if [ ${#LAYERS[@]} -eq 0 ]; then
  LAYERS=("unit" "integration" "scenario")
fi

# サーバが必要なレイヤーか
need_server=0
for layer in "${LAYERS[@]}"; do
  if [[ "$layer" == "integration" || "$layer" == "scenario" ]]; then
    need_server=1
  fi
done

server_pid=""
if [ "$need_server" -eq 1 ]; then
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8765/index.html | grep -q 200; then
    echo "[run.sh] http server already running on :8765"
  else
    echo "[run.sh] starting python3 -m http.server 8765 ..."
    (cd "$PROTOTYPE_DIR" && python3 -m http.server 8765 >/dev/null 2>&1) &
    server_pid=$!
    sleep 1.5
  fi
fi

cleanup() {
  if [ -n "$server_pid" ]; then
    kill "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

total_failed=0

run_layer() {
  local layer="$1"
  local dir="$TESTS_DIR/$layer"
  if [ ! -d "$dir" ]; then
    echo "[run.sh] $layer: no tests"
    return
  fi
  echo ""
  echo "=================================="
  echo "  $layer tests"
  echo "=================================="
  # *.test.js を全部実行
  shopt -s nullglob
  local files=("$dir"/*.test.js)
  shopt -u nullglob
  if [ ${#files[@]} -eq 0 ]; then
    echo "[run.sh] $layer: no *.test.js"
    return
  fi
  for f in "${files[@]}"; do
    echo ""
    echo "--- $(basename "$f") ---"
    if node "$f"; then
      :
    else
      echo "[run.sh] FAILED: $f"
      total_failed=$((total_failed + 1))
    fi
  done
}

for layer in "${LAYERS[@]}"; do
  run_layer "$layer"
done

echo ""
echo "=================================="
if [ "$total_failed" -eq 0 ]; then
  echo "  ✔ all tests passed"
  echo "=================================="
  exit 0
else
  echo "  ✘ $total_failed test file(s) failed"
  echo "=================================="
  exit 1
fi
