#!/usr/bin/env python3
"""Crop and embed the approved Monty Hall illustrations into index.html.

Place host_b_faces.png, goat.png, and car.png in .handoff/assets/ before running.
The generated WebP intermediates go in the ignored .handoff/build/ directory;
only their data URIs are written into index.html.

Usage: python3 tools/make_assets.py [--host PATH] [--goat PATH] [--car PATH] [--index PATH]
"""
from __future__ import annotations

import argparse
import base64
import io
import pathlib
import sys

try:
    from PIL import Image, ImageChops
except ImportError as exc:
    raise SystemExit("Pillow が必要です: python3 -m pip install Pillow") from exc

ROOT = pathlib.Path(__file__).resolve().parent.parent
START = "/* === ASSETS-START === */"
END = "/* === ASSETS-END === */"
RESAMPLE = Image.Resampling.LANCZOS


def webp_bytes(image: Image.Image, quality: int) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="WEBP", quality=quality, method=6)
    return buf.getvalue()


def crop_host_sheet(path: pathlib.Path) -> dict[str, bytes]:
    image = Image.open(path).convert("RGB")
    if image.size != (1376, 768):
        raise ValueError(f"{path}: 1376×768 が必要です（実際: {image.width}×{image.height}）")
    faces: dict[str, bytes] = {}
    names = ("hostNormal", "hostThink", "hostSurprise", "hostSmile")
    for index, name in enumerate(names):
        # 4列を同じ座標・寸法で切り、両隣の列を避けて胸から上を揃える。
        x = index * 344 + 12
        crop = image.crop((x, 48, x + 320, 368)).resize((160, 160), RESAMPLE)
        faces[name] = webp_bytes(crop, 80)
    return faces


def crop_subject(path: pathlib.Path) -> bytes:
    image = Image.open(path).convert("RGB")
    if image.size != (1024, 1024):
        raise ValueError(f"{path}: 1024×1024 が必要です（実際: {image.width}×{image.height}）")
    # 明るい背景を見つける。元画像の白いムラはそのまま保持し、透過化しない。
    diff = ImageChops.difference(image, Image.new("RGB", image.size, "white"))
    channels = [channel.point(lambda p: 255 if p <= 10 else 0) for channel in diff.split()]
    light = ImageChops.multiply(ImageChops.multiply(channels[0], channels[1]), channels[2])
    bbox = light.getbbox()
    if bbox is None:
        raise ValueError(f"{path}: 白以外の絵を検出できません")
    left, top, right, bottom = bbox
    margin = max(1, round(max(right - left, bottom - top) * 0.05))
    left, top = max(0, left - margin), max(0, top - margin)
    right, bottom = min(image.width, right + margin), min(image.height, bottom + margin)
    crop = image.crop((left, top, right, bottom))
    scale = 240 / max(crop.size)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    return webp_bytes(crop.resize(size, RESAMPLE), 75)


def data_uri(payload: bytes) -> str:
    return "data:image/webp;base64," + base64.b64encode(payload).decode("ascii")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", type=pathlib.Path, default=ROOT / ".handoff/assets/host_b_faces.png")
    parser.add_argument("--goat", type=pathlib.Path, default=ROOT / ".handoff/assets/goat.png")
    parser.add_argument("--car", type=pathlib.Path, default=ROOT / ".handoff/assets/car.png")
    parser.add_argument("--index", type=pathlib.Path, default=ROOT / "index.html")
    args = parser.parse_args()
    for path in (args.host, args.goat, args.car):
        if not path.is_file():
            print(f"素材がありません: {path}\n素材は .handoff/assets/ に置いてから実行してください。", file=sys.stderr)
            return 1

    try:
        assets = crop_host_sheet(args.host)
        assets["goat"] = crop_subject(args.goat)
        assets["car"] = crop_subject(args.car)
    except (OSError, ValueError) as exc:
        print(f"素材を処理できません: {exc}", file=sys.stderr)
        return 1

    build_dir = ROOT / ".handoff/build"
    build_dir.mkdir(parents=True, exist_ok=True)
    for key, payload in assets.items():
        (build_dir / f"{key}.webp").write_bytes(payload)

    block = START + "\n  const ASSETS = {\n"
    block += ",\n".join(f'    {key}: "{data_uri(payload)}"' for key, payload in assets.items())
    block += "\n  };\n  " + END
    html = args.index.read_text(encoding="utf-8")
    if html.count(START) != 1 or html.count(END) != 1 or html.index(START) > html.index(END):
        print("index.html に ASSETS マーカーが必要です（開始・終了各1つ）。", file=sys.stderr)
        return 1
    start = html.index(START)
    end = html.index(END) + len(END)
    args.index.write_text(html[:start] + block + html[end:], encoding="utf-8")
    for key, payload in assets.items():
        print(f"{key}: {len(payload):,} bytes")
    print(f"index.html: {args.index.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
