/**
 * SustainabilityNewsReport — レポート見本
 *
 * 食品メーカーの ISSB / TCFD / TNFD 対応状況をまとめるニュースレポートUI。
 *
 * 【このファイルについて】
 * Cursor Canvas SDK（cursor/canvas）を使って作成したデザイン見本です。
 * Cursor 上のキャンバスとしてそのまま動作します。
 *
 * 【実際の React アプリへ移植する際の変更点】
 * 1. import 元を cursor/canvas → 実際の UI ライブラリ（MUI / shadcn/ui など）に差し替える
 * 2. useCanvasState → useState / useSearchParams などに置き換える
 * 3. useHostTheme → CSS 変数 / テーマプロバイダーに置き換える
 * 4. SustainabilityNewsReport コンポーネントで ALL_ARTICLES を
 *    API フェッチ結果に差し替える（ReportView の props 設計はそのまま使用可）
 *
 * 【コンポーネント構成】
 * SustainabilityNewsReport   ← データ注入層（API 連携時はここだけ書き換える）
 *   └─ ReportView            ← 表示ロジック層（articles / isLoading / error を受け取る）
 *        ├─ FeaturedArticle  ← トップストーリー
 *        ├─ ArticleCard      ← 記事グリッドの1カード
 *        └─ CategoryPill     ← カテゴリラベル
 */

import React from "react";
import {
  Card, CardBody,
  Stack, Row, Grid,
  H1, H2, H3, Text, Divider, Pill, Stat, Callout,
  useHostTheme, useCanvasState,
} from "cursor/canvas";

// ───────────────────────────────────────────────
// 型定義
// ───────────────────────────────────────────────

// カテゴリをユニオン型で列挙 — 存在しない文字列はコンパイルエラーになる
type Category =
  | "ISSB対応"
  | "TCFD開示"
  | "規制・義務化"
  | "TNFD/生物多様性"
  | "サプライチェーン";

interface Article {
  id: number;
  category: Category;
  headline: string;
  source: string;
  time: string;
  summary: string;
  important: boolean;
}

// ───────────────────────────────────────────────
// モックデータ（食品メーカー × 情報開示基準）
// API 連携時は SustainabilityNewsReport 内で差し替える
// ───────────────────────────────────────────────
const ALL_ARTICLES: Article[] = [
  {
    id: 1,
    category: "ISSB対応",
    headline: "日清食品HD、IFRS S1/S2準拠の統合報告書を2026年度から義務対応へ移行",
    source: "日経新聞",
    time: "1時間前",
    summary:
      "日清食品ホールディングスは、ISSBが公表したIFRS S1（一般開示要求）およびS2（気候関連開示）に基づく情報開示を2026年度から本格実施すると発表。業界内での早期適用事例として注目される。",
    important: true,
  },
  {
    id: 2,
    category: "TCFD開示",
    headline: "味の素グループ、スコープ3排出量をTCFDシナリオ分析で定量化し初開示",
    source: "Bloomberg Green",
    time: "3時間前",
    summary:
      "味の素グループは2026年度版サステナビリティレポートで、TCFDが推奨するシナリオ分析（1.5℃・4℃シナリオ）を用いてスコープ3排出量の財務インパクトを初めて定量的に開示した。",
    important: false,
  },
  {
    id: 3,
    category: "規制・義務化",
    headline: "EU、食品・農業企業へのCSRDD義務化範囲を2027年に中堅企業まで拡大",
    source: "Financial Times",
    time: "4時間前",
    summary:
      "欧州連合の企業サステナビリティ・デューデリジェンス指令（CSDDD）が2027年から従業員500人以上の食品・農業企業にも適用される。日系食品メーカーの欧州子会社も対象に含まれる見通し。",
    important: true,
  },
  {
    id: 4,
    category: "TNFD/生物多様性",
    headline: "キッコーマン、TNFDフレームワークを試験導入し農業用地の生態系影響を開示",
    source: "Reuters",
    time: "5時間前",
    summary:
      "キッコーマンは自然関連財務情報開示タスクフォース（TNFD）v1.0に基づき、大豆・小麦調達先の農業用地が生態系サービスに与える影響度の評価結果を統合報告書に掲載した。",
    important: false,
  },
  {
    id: 5,
    category: "サプライチェーン",
    headline: "カゴメ、農業調達サプライチェーン全体のGHG排出量をSBTi基準で算定・公開",
    source: "日経ESG",
    time: "6時間前",
    summary:
      "カゴメはトマト・野菜の調達先農家を含むサプライチェーン全体（スコープ3カテゴリ1）の温室効果ガス排出量を科学的根拠に基づく目標イニシアチブ（SBTi）の手法で初めて算定し公開した。",
    important: false,
  },
  {
    id: 6,
    category: "TCFD開示",
    headline: "明治HD、気候変動リスクが中期売上に与える財務影響額を初めて数値で開示",
    source: "The Guardian",
    time: "7時間前",
    summary:
      "明治ホールディングスはTCFD提言に基づき、移行リスク（炭素税）と物理的リスク（原料価格変動）が2030年時点の売上高に与える影響を±XX億円の形式で定量開示。投資家から高評価を得ている。",
    important: false,
  },
  {
    id: 7,
    category: "ISSB対応",
    headline: "ネスレ、ISSB基準の自主的早期適用を宣言し開示水準でグローバル食品企業をリード",
    source: "WSJ",
    time: "9時間前",
    summary:
      "ネスレはISSB基準を2025年度報告書から自主的に早期適用すると宣言。気候関連・一般サステナビリティ情報の双方を単一の統合報告書にまとめ、世界の食品大手の中で最高水準の開示を達成した。",
    important: false,
  },
  {
    id: 8,
    category: "規制・義務化",
    headline: "金融庁、有価証券報告書へのサステナビリティ開示記載要件を2027年から強化",
    source: "日経新聞",
    time: "10時間前",
    summary:
      "金融庁は2027年3月期以降の有価証券報告書において、ISSB基準に準拠したサステナビリティ関連情報の記載を大手上場企業に義務付ける方針を固めた。食品大手各社は対応コストの試算を開始している。",
    important: false,
  },
  {
    id: 9,
    category: "サプライチェーン",
    headline: "伊藤ハム米久HD、畜産サプライチェーンのメタン排出量を系列農場まで遡及して算定",
    source: "日経ESG",
    time: "12時間前",
    summary:
      "伊藤ハム米久ホールディングスは、豚・牛の飼育過程で発生するメタン（CH4）排出量を契約農場レベルまで遡って算定するシステムを導入。農林水産省のガイドラインとSBTiの両方に対応した算定手法を採用した。",
    important: false,
  },
];

// ───────────────────────────────────────────────
// カテゴリ設定（色・アイコンを一元管理）
// Record<Category, CategoryConfig> により全カテゴリの網羅をコンパイル時に保証
// ───────────────────────────────────────────────
type ToneType = "info" | "success" | "warning" | "neutral";

interface CategoryConfig {
  tone: ToneType;
  icon: React.ReactNode;
}

function IconReport() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="10" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 1v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function IconThermometer() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M8 9.5V3a1 1 0 0 0-2 0v6.5a2.5 2.5 0 1 0 2 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="7" cy="12" r="1" fill="currentColor"/>
    </svg>
  );
}

function IconGavel() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M2 14l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="5.5" y="1.5" width="5" height="8" rx="1" transform="rotate(45 5.5 1.5)" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconLeaf() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M13 2C13 2 13 9 8 11C5 12.5 3 11 2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 14C2 14 3 7 10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconChain() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="6" width="5" height="4" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="6" width="5" height="4" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  "ISSB対応":        { tone: "info",    icon: <IconReport /> },
  "TCFD開示":        { tone: "warning", icon: <IconThermometer /> },
  "規制・義務化":    { tone: "neutral", icon: <IconGavel /> },
  "TNFD/生物多様性": { tone: "success", icon: <IconLeaf /> },
  "サプライチェーン": { tone: "neutral", icon: <IconChain /> },
};

const CATEGORIES = ["すべて", ...Object.keys(CATEGORY_CONFIG)];

// ───────────────────────────────────────────────
// 共通コンポーネント
// ───────────────────────────────────────────────
function CategoryPill({ category }: { category: Category }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <Pill tone={cfg.tone} size="sm" leadingContent={cfg.icon}>
      {category}
    </Pill>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Card>
      <CardBody>
        <Stack gap={8}>
          <Row gap={8} align="center">
            <CategoryPill category={article.category} />
            {article.important && <Pill tone="warning" size="sm" active>注目</Pill>}
          </Row>
          <H3>{article.headline}</H3>
          <Text tone="secondary" style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {article.summary}
          </Text>
          <Row gap={8} align="center" style={{ marginTop: 4 }}>
            <Text tone="tertiary" size="small" weight="medium">{article.source}</Text>
            <Text tone="quaternary" size="small">·</Text>
            <Text tone="quaternary" size="small">{article.time}</Text>
          </Row>
        </Stack>
      </CardBody>
    </Card>
  );
}

function FeaturedArticle({ article }: { article: Article }) {
  const theme = useHostTheme();
  return (
    <div style={{
      border: `1px solid ${theme.stroke.primary}`,
      borderRadius: 8,
      padding: 20,
      background: theme.fill.secondary,
    }}>
      <Stack gap={10}>
        <Row gap={8} align="center">
          <CategoryPill category={article.category} />
          <Pill tone="warning" size="sm" active>トップストーリー</Pill>
        </Row>
        <H2>{article.headline}</H2>
        <Text tone="secondary">{article.summary}</Text>
        <Row gap={8} align="center">
          <Text tone="tertiary" size="small" weight="medium">{article.source}</Text>
          <Text tone="quaternary" size="small">·</Text>
          <Text tone="quaternary" size="small">{article.time}</Text>
        </Row>
      </Stack>
    </div>
  );
}

// ───────────────────────────────────────────────
// ReportView の props 定義
// ───────────────────────────────────────────────
interface ReportProps {
  articles: Article[];
  isLoading?: boolean;
  error?: string | null;
}

// ───────────────────────────────────────────────
// 表示ロジックを担うコンポーネント（props ベース）
// 将来 API 連携する際はここへ articles / isLoading / error を渡すだけで対応できる
// ───────────────────────────────────────────────
function ReportView({ articles, isLoading = false, error = null }: ReportProps) {
  const [activeCategory, setActiveCategory] = useCanvasState("activeCategory", "すべて");

  if (isLoading) {
    return (
      <Stack gap={16} style={{ padding: 24 }}>
        <Callout tone="info" title="データ読み込み中">
          ニュースを取得しています。しばらくお待ちください。
        </Callout>
      </Stack>
    );
  }
  if (error) {
    return (
      <Stack gap={16} style={{ padding: 24 }}>
        <Callout tone="warning" title="取得エラー">{error}</Callout>
      </Stack>
    );
  }
  if (articles.length === 0) {
    return (
      <Stack gap={16} style={{ padding: 24 }}>
        <Callout tone="neutral" title="記事なし">
          現在、収集された記事がありません。データソースの設定を確認してください。
        </Callout>
      </Stack>
    );
  }

  const categoryCounts: Record<string, number> = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "すべて"
      ? articles.length
      : articles.filter((a) => a.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = activeCategory === "すべて"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  const featured = articles.find((a) => a.important) ?? articles[0];
  const gridArticles = activeCategory === "すべて"
    ? filtered.filter((a) => a !== featured)
    : filtered;

  const totalStories = articles.length;
  const filteredCount = filtered.length;
  const sourceCount = new Set(articles.map((a) => a.source)).size;
  const importantCount = articles.filter((a) => a.important).length;

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* ヘッダー */}
      <Row align="center" justify="space-between">
        <Stack gap={4}>
          <H1>食品メーカー サステナビリティ開示動向レポート</H1>
          <Text tone="tertiary" size="small">
            ISSB / TCFD / TNFD 対応状況モニタリング　·　最終更新: 2026年5月31日 08:12 JST
          </Text>
        </Stack>
      </Row>

      {/* サマリー統計 */}
      <Grid columns={3} gap={16}>
        <Stat
          value={totalStories}
          label={activeCategory === "すべて" ? "収集記事数" : `収集記事数（${filteredCount}件表示中）`}
        />
        <Stat value={sourceCount} label="メディアソース" />
        <Stat value={importantCount} label="注目ニュース" tone="warning" />
      </Grid>

      <Divider />

      {/* カテゴリフィルター */}
      <Row gap={8} wrap>
        {CATEGORIES.map((cat) => {
          const cfg = cat === "すべて" ? undefined : CATEGORY_CONFIG[cat as Category];
          return (
            <Pill
              key={cat}
              tone={cfg?.tone ?? "neutral"}
              active={cat === activeCategory}
              leadingContent={cfg?.icon ?? <IconGrid />}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} ({categoryCounts[cat]})
            </Pill>
          );
        })}
      </Row>

      {/* トップストーリー（すべて表示時のみ） */}
      {activeCategory === "すべて" && <FeaturedArticle article={featured} />}

      {/* 記事グリッド */}
      {gridArticles.length > 0 ? (
        <>
          <Text weight="semibold" tone="secondary">
            {activeCategory === "すべて" ? "その他のニュース" : activeCategory}
          </Text>
          <Grid columns={3} gap={16}>
            {gridArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </Grid>
        </>
      ) : (
        <Callout tone="neutral" title="該当記事なし">
          このカテゴリの記事は現在収集されていません。
        </Callout>
      )}

      {/* フッター */}
      <Divider />
      <Row align="center" justify="space-between">
        <Text tone="quaternary" size="small">
          データソース: 日経新聞, 日経ESG, Bloomberg Green, Financial Times, Reuters, The Guardian, WSJ
        </Text>
        <Text tone="quaternary" size="small">最終更新: 2026年5月31日 08:12 JST</Text>
      </Row>
    </Stack>
  );
}

// ───────────────────────────────────────────────
// エントリーポイント（データ注入層）
// API 連携時はここだけを書き換える
// 例: const { data, isLoading, error } = useFetch("/api/articles");
//     return <ReportView articles={data ?? []} isLoading={isLoading} error={error} />;
// ───────────────────────────────────────────────
export default function SustainabilityNewsReport() {
  return <ReportView articles={ALL_ARTICLES} />;
}
