#!/usr/bin/env python3
"""i18n/*.json から index.html の辞書ブロックを再生成する。

翻訳を直したいときは i18n/<言語コード>.json を編集し、このスクリプトを実行する。
index.html の I18N-DATA-START / I18N-DATA-END で挟まれた部分だけが置き換わる。

    python3 tools/build_i18n.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = ["ja", "en", "zh-Hans", "zh-Hant", "ko", "ru", "es", "th", "hi", "fr", "ar", "sv"]
# 小数点にコンマを使う言語（静的な文言を実行時の表記に合わせる）
COMMA_LANGS = {"ru", "fr", "es", "sv"}

START = "/* === I18N-DATA-START === */"
END = "/* === I18N-DATA-END === */"


def main() -> int:
    ja = json.loads((ROOT / "i18n" / "ja.json").read_text(encoding="utf-8"))
    placeholder = re.compile(r"\{[a-z]+\}")
    tag = re.compile(r"</?[a-z]+[^>]*>")

    dicts = {}
    problems = []
    for code in LANGS:
        path = ROOT / "i18n" / f"{code}.json"
        if not path.exists():
            problems.append(f"{code}: ファイルがない")
            continue
        d = json.loads(path.read_text(encoding="utf-8"))
        for key in ja:
            if key not in d:
                problems.append(f"{code}: キー {key} がない")
                continue
            if sorted(placeholder.findall(ja[key])) != sorted(placeholder.findall(d[key])):
                problems.append(f"{code}/{key}: プレースホルダが日本語版と違う")
            if sorted(tag.findall(ja[key])) != sorted(tag.findall(d[key])):
                problems.append(f"{code}/{key}: HTMLタグが日本語版と違う")
        sep = "," if code in COMMA_LANGS else "."
        for key, value in d.items():
            value = value.replace("33.3", "33" + sep + "3").replace("33,3", "33" + sep + "3")
            value = value.replace("66.7", "66" + sep + "7").replace("66,7", "66" + sep + "7")
            d[key] = value
        dicts[code] = d

    if problems:
        print("翻訳ファイルに問題があります:")
        for p in problems:
            print("  -", p)
        return 1

    body = json.dumps(dicts, ensure_ascii=False, indent=2).replace("\n", "\n  ")
    block = START + "\n  const I18N = " + body + ";\n" + END

    html_path = ROOT / "index.html"
    html = html_path.read_text(encoding="utf-8")
    i, j = html.index(START), html.index(END) + len(END)
    html_path.write_text(html[:i] + block + html[j:], encoding="utf-8")
    print(f"{len(dicts)} 言語 × {len(ja)} キーを index.html に書き込みました。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
