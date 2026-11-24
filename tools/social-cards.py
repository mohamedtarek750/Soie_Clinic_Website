#!/usr/bin/env python3
"""Refresh committed share cards after adding pages. Optional authoring tool, not part of the build.

Requires Pillow with libraqm, DejaVu Serif and DejaVu Sans (regular).
"""

import json
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGE = ROOT / "assets/images"
POSTER = ROOT / "assets/videos/posters"
SERIF = "DejaVuSerif.ttf"
ARABIC = "DejaVuSans.ttf"  # Covers both Arabic script and Latin device names.
ROSE = "#956153"
ESPRESSO = "#402e28"
IVORY = "#fbf6ef"


def photography(path):
    # Branch photos have no confirmed branch labels. Use abstract imagery for branch cards.
    leaf = path.split("/")[-1]
    if leaf in ("indiba-deep-care", "cutera-excel-hr", "finexel-fractional-co2"):
        return POSTER / ({"indiba-deep-care": "indiba-session"}.get(leaf, leaf) + ".jpg")
    if leaf in ("skin-boosters", "exosomes", "body-contouring"):
        return POSTER / ("bg-" + leaf + ".jpg")
    if "nutrition" in path:
        return IMAGE / "cat-nutrition.jpg"
    if "plastic-surgery" in path:
        return IMAGE / "cat-plastic-surgery.jpg"
    if path.startswith("/dentistry"):
        name = "veneers" if leaf in ("veneers", "hollywood-smile") else "dentistry"
    elif "laser" in leaf:
        name = "laser"
    elif leaf in ("sculptra", "profhilo", "radiesse", "prp", "mesotherapy", "botox-or-filler"):
        name = "botox"
    elif leaf in ("lip-filler", "fat-dissolving-injections"):
        name = "dermal-filler"
    elif leaf in ("oxygeneo", "microneedling", "acne-treatment", "hair-and-scalp"):
        name = "facial"
    elif path.startswith("/branches"):
        name = "services"
    elif leaf in ("guides", "privacy", "404"):
        name = "faq"
    elif leaf in ("devices", "treatments"):
        name = "services"
    elif leaf == "results":
        name = "before-after"
    elif leaf == "iv-therapy":
        name = "book"
    else:
        name = leaf or "home"
    file = IMAGE / "bg" / (name + "-1920.jpg")
    return file if file.exists() else IMAGE / "bg/about-1920.jpg"


def lines(draw, text, font, direction):
    result = []
    line = ""
    for word in text.split():
        proposed = (line + " " + word).strip()
        if line and draw.textlength(proposed, font=font, direction=direction) > 505:
            result.append(line)
            line = word
        else:
            line = proposed
    if line:
        result.append(line)
    return result


def card(lang, page, brand):
    is_ar = lang == "ar"
    direction = "rtl" if is_ar else "ltr"
    anchor = "rm" if is_ar else "lm"
    photo = Image.open(photography(page["path"])).convert("RGB")
    photo = ImageOps.fit(photo, (565, 630), method=Image.Resampling.LANCZOS)
    image = Image.new("RGB", (1200, 630), IVORY)
    image.paste(photo, (0 if is_ar else 635, 0))
    draw = ImageDraw.Draw(image)
    x = 1140 if is_ar else 60
    draw.text((x, 110), brand, fill=ROSE, font=ImageFont.truetype(SERIF, 34), anchor=anchor)
    rule = (x - 80, x) if is_ar else (x, x + 80)
    draw.line((rule[0], 156, rule[1], 156), width=2, fill=ROSE)
    text = re.sub(r"\s+([.,،؟])", r"\1", page["h1"].replace("{{brand}}", brand))
    for size in range(52, 21, -2):
        font = ImageFont.truetype(ARABIC if is_ar else SERIF, size)
        wrapped = lines(draw, text, font, direction)
        if len(wrapped) <= 4 and all(draw.textlength(line, font=font, direction=direction) <= 505 for line in wrapped):
            break
    spacing = int(size * 1.55)
    y = 345 - (len(wrapped) - 1) * spacing // 2
    for line in wrapped:
        draw.text((x, y), line, fill=ESPRESSO, font=font, direction=direction, anchor=anchor)
        y += spacing
    directory = ROOT / "assets/social" / lang
    directory.mkdir(exist_ok=True, parents=True)
    slug = page["path"].strip("/").replace("/", "--") or "home"
    image.save(directory / (slug + ".jpg"), quality=84, optimize=True, progressive=True)


def main():
    brand = json.loads((ROOT / "data/site.json").read_text())["brand"]["nameEn"]
    for lang in ("en", "ar"):
        for path in sorted((ROOT / "src" / "content" / lang).glob("*.json")):
            card(lang, json.loads(path.read_text()), brand)


if __name__ == "__main__":
    main()
