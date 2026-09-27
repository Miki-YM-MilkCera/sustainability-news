"""
summarize.py — Gemini API による記事要約

output/articles.json を読み込み、各記事の summary フィールドを
Gemini 1.5 Flash で日本語200字以内の要約に置き換えて上書き保存する。

費用目安: 1記事あたり約 $0.0001（週12件で月 $0.005 ≒ 0.7円）
"""

import json
import os
import sys
import time

import google.generativeai as genai

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_PATH = os.path.join(ROOT, "output", "articles.json")

PROMPT_TEMPLATE = """\
以下のESGニュース記事を日本語で200字以内に要約してください。
HTMLタグは除去し、投資家・企業担当者向けに平易かつ具体的な日本語でまとめてください。
要約のみを出力し、前置きや「要約:」などのラベルは付けないでください。

タイトル: {headline}
本文: {summary}"""


def summarize_articles(articles: list[dict]) -> list[dict]:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        print("::warning::GEMINI_API_KEY が設定されていません。要約をスキップします。", file=sys.stderr)
        return articles

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    for i, article in enumerate(articles):
        raw_summary = article.get("summary", "").strip()
        if not raw_summary:
            continue

        prompt = PROMPT_TEMPLATE.format(
            headline=article["headline"],
            summary=raw_summary[:1000],
        )

        try:
            response = model.generate_content(prompt)
            article["summary"] = response.text.strip()
            print(f"  [{i + 1}/{len(articles)}] 要約完了: {article['headline'][:40]}…")
        except Exception as e:
            print(
                f"::warning::記事 {article['id']} の要約に失敗しました: {e}",
                file=sys.stderr,
            )

        # API レート制限対策（1秒待機）
        if i < len(articles) - 1:
            time.sleep(1)

    return articles


def main():
    if not os.path.exists(ARTICLES_PATH):
        print(f"エラー: {ARTICLES_PATH} が見つかりません。fetch_news.py を先に実行してください。")
        sys.exit(1)

    with open(ARTICLES_PATH, encoding="utf-8") as f:
        articles = json.load(f)

    print(f"要約対象: {len(articles)} 件")
    articles = summarize_articles(articles)

    with open(ARTICLES_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f"要約完了 → {ARTICLES_PATH}")


if __name__ == "__main__":
    main()
