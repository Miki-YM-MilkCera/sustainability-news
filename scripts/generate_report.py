"""
generate_report.py — HTMLレポート生成

output/articles.json を読み込み、Jinja2 テンプレートで
output/index.html を生成する。
"""

import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone, timedelta

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_PATH = os.path.join(ROOT, "output", "articles.json")
OUTPUT_PATH   = os.path.join(ROOT, "output", "index.html")
TEMPLATE_DIR  = os.path.join(ROOT, "templates")

JST = timezone(timedelta(hours=9))


def unique_filter(iterable):
    seen = set()
    result = []
    for item in iterable:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def build_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["unique"] = unique_filter
    return env


def main():
    if not os.path.exists(ARTICLES_PATH):
        print(f"エラー: {ARTICLES_PATH} が見つかりません。", file=sys.stderr)
        sys.exit(1)

    with open(ARTICLES_PATH, encoding="utf-8") as f:
        articles = json.load(f)

    if not articles:
        print("記事が0件のため、HTMLレポートの生成をスキップします。")
        sys.exit(0)

    generated_at = datetime.now(JST).strftime("%Y年%m月%d日 %H:%M JST")

    env = build_env()
    template = env.get_template("report.html.j2")

    html = template.render(
        articles=articles,
        generated_at=generated_at,
    )

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"HTMLレポート生成完了 ({len(articles)} 件) → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
