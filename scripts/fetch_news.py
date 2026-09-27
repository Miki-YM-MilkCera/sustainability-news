"""
fetch_news.py — RSS フェッチ・フィルタ・カテゴリ分類

処理フロー:
  1. config/sources.yaml のフィードを feedparser で取得
  2. bozo チェックで廃止・不正フィードを GitHub Actions Warning として記録
  3. URLベースで重複を排除
  4. 食品メーカー名 × フレームワークキーワードでフィルタリング
  5. カテゴリを分類（先着優先）
  6. 重要度スコアで並べ替え、トップ記事を important=True にマーク
  7. output/articles.json に保存
  8. GITHUB_OUTPUT に has_articles=true/false を書き込む
"""

import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta

import feedparser
import yaml

JST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_config():
    with open(os.path.join(ROOT, "config", "sources.yaml"), encoding="utf-8") as f:
        sources = yaml.safe_load(f)
    with open(os.path.join(ROOT, "config", "keywords.yaml"), encoding="utf-8") as f:
        keywords = yaml.safe_load(f)
    return sources["sources"], keywords


def contains_any(text: str, words: list[str]) -> bool:
    return any(w in text for w in words)


def get_category(text: str, categories: dict) -> str | None:
    """カテゴリキーワードを先着順でマッチング（最初にマッチしたカテゴリを採用）"""
    for cat, kws in categories.items():
        if contains_any(text, kws):
            return cat
    return None


def importance_score(headline: str, summary: str, food_companies: list, high_priority: list) -> int:
    score = 0
    for word in high_priority:
        if word in headline:
            score += 3
    for company in food_companies:
        if company in headline:
            score += 2
        elif company in summary:
            score += 1
    return score


def parse_time(entry) -> str:
    published = entry.get("published_parsed") or entry.get("updated_parsed")
    if published:
        try:
            dt = datetime(*published[:6], tzinfo=timezone.utc).astimezone(JST)
            return dt.strftime("%Y年%m月%d日 %H:%M JST")
        except Exception:
            pass
    return "日時不明"


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


def fetch_all(sources: list, keywords: dict) -> list:
    food_companies = keywords["food_companies"]
    frameworks = keywords["frameworks"]
    categories = keywords["categories"]
    high_priority = keywords.get("high_priority", [])

    seen_urls: set[str] = set()
    articles: list[dict] = []

    for source in sources:
        url = source["url"]
        name = source["name"]
        require_company = source.get("require_company", True)

        result = feedparser.parse(url)

        if result.bozo:
            print(
                f"::warning::フィード取得に問題あり: {name} ({url})"
                f" — {result.bozo_exception}",
                file=sys.stderr,
            )

        for entry in result.entries:
            link = entry.get("link", "").strip()
            if not link or link in seen_urls:
                continue
            seen_urls.add(link)

            title = strip_html(entry.get("title", ""))
            raw_summary = strip_html(entry.get("summary", "") or entry.get("description", ""))
            full_text = f"{title} {raw_summary}"

            # フレームワークキーワードを含まない記事は除外
            if not contains_any(full_text, frameworks):
                continue

            # require_company=True のソースは食品メーカー名マッチが必要
            if require_company and not contains_any(full_text, food_companies):
                continue

            category = get_category(full_text, categories)
            if category is None:
                continue

            score = importance_score(title, raw_summary, food_companies, high_priority)

            articles.append({
                "headline": title,
                "source": name,
                "url": link,
                "time": parse_time(entry),
                "summary": raw_summary[:500],  # Gemini 要約前の生テキスト（最大500字）
                "category": category,
                "important": False,  # 後でスコアに基づき1件だけ True にする
                "_score": score,
            })

    # 重要度スコアで降順ソート → 上位記事を important=True
    articles.sort(key=lambda a: a["_score"], reverse=True)
    if articles:
        articles[0]["important"] = True

    # IDを付与してスコアフィールドを除去
    for i, article in enumerate(articles, start=1):
        article["id"] = i
        del article["_score"]

    return articles


def write_github_output(has_articles: bool):
    value = "true" if has_articles else "false"
    github_output = os.environ.get("GITHUB_OUTPUT", "")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as f:
            f.write(f"has_articles={value}\n")
    else:
        # ローカル実行時はコンソールに出力
        print(f"has_articles={value}")


def main():
    sources, keywords = load_config()
    articles = fetch_all(sources, keywords)

    output_dir = os.path.join(ROOT, "output")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "articles.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f"収集記事数: {len(articles)} 件 → {output_path}")

    write_github_output(has_articles=len(articles) > 0)

    if not articles:
        print("::notice::今週は対象記事が0件でした。後続ステップをスキップします。")


if __name__ == "__main__":
    main()
