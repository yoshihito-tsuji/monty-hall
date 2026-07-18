#!/usr/bin/env bash
# ヘッドレスブラウザで index.html を実際に操作し、ルールと表示を検証する。
#
#   ./tests/run.sh            すべてのテストを実行
#   ./tests/run.sh 03         03 で始まるテストだけ実行
#
# ブラウザは CHROME 環境変数で指定できる。省略時は自動で探す。
set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FILTER=${1:-}

CHROME=${CHROME:-}
if [ -z "$CHROME" ]; then
  for c in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v "$c" >/dev/null 2>&1; then CHROME=$(command -v "$c"); break; fi
  done
fi
if [ -z "$CHROME" ]; then
  echo "エラー: Chrome も Chromium も見つかりません。CHROME 環境変数で指定してください。" >&2
  exit 1
fi
echo "ブラウザ: $CHROME"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# テストごとの上限時間（仮想時間のミリ秒）。試行回数の多いものほど長く要る。
budget_for() {
  case "$1" in
    01-*) echo 180000 ;;
    02-*) echo  60000 ;;
    03-*) echo 200000 ;;
    04-*) echo  30000 ;;
    05-*) echo 200000 ;;
    *)    echo 120000 ;;
  esac
}

pass=0
fail=0

for driver in "$ROOT"/tests/drivers/*.js; do
  name=$(basename "$driver" .js)
  case "$name" in
    ${FILTER}*) ;;
    *) continue ;;
  esac

  page="$TMP/$name.html"
  {
    cat "$ROOT/index.html"
    # 検証中はアニメーションを止める（ヘッドレスでは描画が追いつかないため）
    printf '<style>*{transition:none!important;animation:none!important}</style>\n<script>\n'
    cat "$driver"
    printf '</script>\n'
  } > "$page"

  out=$("$CHROME" --headless --disable-gpu --no-sandbox \
        --virtual-time-budget="$(budget_for "$name")" --dump-dom \
        "file://$page?lang=ja" 2>/dev/null \
        | sed -n '/<pre id="testlog"/,/<\/pre>/p' | sed 's/<[^>]*>//g')

  echo "── $name"
  if [ -n "$out" ]; then echo "$out" | sed 's/^/   /'; fi

  if printf '%s' "$out" | grep -q "RESULT: ALL PASS"; then
    pass=$((pass + 1))
  else
    echo "   ✗ 失敗（RESULT: ALL PASS が出力されませんでした）"
    fail=$((fail + 1))
  fi
done

echo
if [ "$fail" -eq 0 ] && [ "$pass" -gt 0 ]; then
  echo "テスト $pass 件すべて合格しました。"
  exit 0
fi
if [ "$pass" -eq 0 ] && [ "$fail" -eq 0 ]; then
  echo "エラー: 実行対象のテストがありません（フィルタ: '${FILTER}'）。" >&2
  exit 1
fi
echo "合格 $pass 件 / 失敗 $fail 件。"
exit 1
