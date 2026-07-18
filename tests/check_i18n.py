#!/usr/bin/env python3
"""翻訳ファイルの整合性と、index.html への反映漏れを検査する。

    python3 tests/check_i18n.py

次の3点を確認する。
1. 各言語のキーが日本語版と一致すること
2. プレースホルダ（{n} など）とHTMLタグが日本語版と一致すること
   （食い違うと、実行時に文が壊れたり値が埋まらなかったりする）
3. i18n/*.json の内容が index.html に反映済みであること
   （JSONだけ直してビルドを忘れると、公開ページに反映されない）
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = ["ja", "en", "zh-Hans", "zh-Hant", "ko", "ru", "es", "th", "hi", "fr", "ar", "sv"]

PLACEHOLDER = re.compile(r"\{[a-z]+\}")
TAG = re.compile(r"</?[a-z]+[^>]*>")


def main() -> int:
    problems = []
    ja = json.loads((ROOT / "i18n" / "ja.json").read_text(encoding="utf-8"))

    for code in LANGS:
        path = ROOT / "i18n" / f"{code}.json"
        if not path.exists():
            problems.append(f"{code}: ファイルがない")
            continue
        try:
            d = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            problems.append(f"{code}: JSONとして読めない（{e}）")
            continue

        for key in ja:
            if key not in d:
                problems.append(f"{code}: キー {key} がない")
                continue
            if not d[key].strip():
                problems.append(f"{code}/{key}: 空文字")
            if sorted(PLACEHOLDER.findall(ja[key])) != sorted(PLACEHOLDER.findall(d[key])):
                problems.append(
                    f"{code}/{key}: プレースホルダが日本語版と違う "
                    f"（ja={PLACEHOLDER.findall(ja[key])} {code}={PLACEHOLDER.findall(d[key])}）"
                )
            if sorted(TAG.findall(ja[key])) != sorted(TAG.findall(d[key])):
                problems.append(f"{code}/{key}: HTMLタグが日本語版と違う")
        for key in d:
            if key not in ja:
                problems.append(f"{code}: 日本語版にないキー {key} がある")

    if problems:
        print("翻訳ファイルに問題があります:")
        for p in problems:
            print("  -", p)
        return 1
    print(f"翻訳ファイル: {len(LANGS)} 言語 × {len(ja)} キー — 整合しています。")

    # 反映漏れの検査：ビルドし直して index.html が変わるなら、JSONの変更が未反映
    before = (ROOT / "index.html").read_bytes()
    result = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "build_i18n.py")],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print("ビルドに失敗しました:")
        print(result.stdout or result.stderr)
        return 1
    after = (ROOT / "index.html").read_bytes()
    if before != after:
        (ROOT / "index.html").write_bytes(before)  # 検査なので元に戻す
        print("index.html に翻訳が反映されていません。")
        print("  i18n/*.json を編集したあとは `python3 tools/build_i18n.py` を実行してください。")
        return 1
    print("index.html: 翻訳は反映済みです。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
