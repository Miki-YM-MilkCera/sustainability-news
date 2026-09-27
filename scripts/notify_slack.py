"""
notify_slack.py — Slack Block Kit 通知

output/articles.json を読み込み、カテゴリ別サマリーと
注目ニュース・詳細レポートURLを Slack Incoming Webhook で送信する。

必要な環境変数:
  SLACK_WEBHOOK_URL — Slack App の Incoming Webhook URL
  PAGES_URL         — GitHub Pages の公開URL（workflow が動的に設定）
"""

import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone, timedelta

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_PATH = os.path.join(ROOT, "output", "articles.json")

JST = timezone(timedelta(hours=9))

CATEGORY_ICONS = {
    "ISSB対応":        "🔵",
    "TCFD開示":        "🟠",
    "規制・義務化":    "⚫",
    "TNFD/生物多様性": "🟢",
    "サプライチェーン": "⚫",
}

CATEGORY_ORDER = ["ISSB対応", "TCFD開示", "規制・義務化", "TNFD/生物多様性", "サプライチェーン"]


def build_blocks(articles: list, pages_url: str) -> list:
    today = datetime.now(JST).strftime("%Y年%m月%d日")
    total = len(articles)
    counts = Counter(a["category"] for a in articles)
    featured = next((a for a in articles if a.get("important")), articles[0] if articles else None)

    # カテゴリ別件数テキスト（定義順に並べる）
    category_lines = []
    for cat in CATEGORY_ORDER:
        if counts.get(cat, 0) > 0:
            icon = CATEGORY_ICONS.get(cat, "•")
            category_lines.append(f"{icon} *{cat}*: {counts[cat]}件")
    category_text = "\n".join(category_lines)

    blocks = [
        # ── ヘッダー ──
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"📊 食品メーカー ESGニュース週報｜{today}",
                "emoji": True,
            },
        },
        # ── 件数サマリー ──
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"今週の収集件数: *{total}件*\n\n{category_text}",
            },
        },
        {"type": "divider"},
    ]

    # ── 注目ニュース ──
    if featured:
        headline = featured["headline"]
        source   = featured["source"]
        url      = featured.get("url", "")
        summary  = featured.get("summary", "")[:120]

        link_text = f"<{url}|{headline}>" if url else headline

        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"⭐ *注目ニュース*\n"
                    f"{link_text}\n"
                    f"_{summary}…_\n"
                    f"— {source}"
                ),
            },
        })
        blocks.append({"type": "divider"})

    # ── 詳細レポートボタン ──
    if pages_url:
        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "📄 詳細レポートを開く", "emoji": True},
                    "url": pages_url,
                    "style": "primary",
                }
            ],
        })

    # ── フッター（反映遅延の注記） ──
    blocks.append({
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": "※ レポートページの反映まで数分かかる場合があります。",
            }
        ],
    })

    return blocks


def send_to_slack(webhook_url: str, blocks: list) -> None:
    payload = {"blocks": blocks}
    response = requests.post(
        webhook_url,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=10,
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"Slack通知に失敗しました: HTTP {response.status_code} — {response.text}"
        )


def main():
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")
    pages_url   = os.environ.get("PAGES_URL", "").rstrip("/") + "/"

    if not webhook_url:
        print("エラー: SLACK_WEBHOOK_URL が設定されていません。", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(ARTICLES_PATH):
        print(f"エラー: {ARTICLES_PATH} が見つかりません。", file=sys.stderr)
        sys.exit(1)

    with open(ARTICLES_PATH, encoding="utf-8") as f:
        articles = json.load(f)

    if not articles:
        print("記事が0件のため、Slack通知をスキップします。")
        sys.exit(0)

    blocks = build_blocks(articles, pages_url)
    send_to_slack(webhook_url, blocks)
    print(f"Slack通知完了 ({len(articles)} 件)")


if __name__ == "__main__":
    main()
