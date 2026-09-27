# サステナビリティ・ニュース自動収集ツール

食品メーカーの ISSB / TCFD / TNFD 対応状況をモニタリングするニュースレポートツール。

## レポートデザイン見本

`src/components/SustainabilityNewsReport.tsx`

Cursor Canvas SDK で作成したレポートUIのデザイン見本です。
Cursor 上でキャンバスとして開くと、インタラクティブなプレビューを確認できます。

### カテゴリ構成

| カテゴリ | 色 | 対象 |
|---|---|---|
| ISSB対応 | 青 | IFRS S1/S2 への準拠・開示状況 |
| TCFD開示 | 橙 | 気候関連財務情報の開示状況 |
| 規制・義務化 | グレー | 各国・地域の法規制・義務化動向 |
| TNFD/生物多様性 | 緑 | 自然関連財務情報の開示状況 |
| サプライチェーン | グレー | 農業調達・GHG排出量算定 |

### コンポーネント構成

```
SustainabilityNewsReport   ← データ注入層（API 連携時はここだけ書き換える）
  └─ ReportView            ← 表示ロジック層（articles / isLoading / error を受け取る）
       ├─ FeaturedArticle  ← トップストーリー
       ├─ ArticleCard      ← 記事グリッドの1カード
       └─ CategoryPill     ← カテゴリラベル
```

### 実際の React アプリへ移植する際の変更点

1. `cursor/canvas` の import を実際の UI ライブラリに差し替える
2. `useCanvasState` → `useState` / `useSearchParams` などに置き換える
3. `useHostTheme` → CSS 変数 / テーマプロバイダーに置き換える
4. `ALL_ARTICLES` を API フェッチ結果に差し替える

```tsx
// API 連携時のイメージ
export default function SustainabilityNewsReport() {
  const { data, isLoading, error } = useFetch("/api/articles");
  return <ReportView articles={data ?? []} isLoading={isLoading} error={error} />;
}
```

## 今後の開発ステップ

- [ ] ニュースソース（RSS / NewsAPI）との接続
- [ ] 記事の自動収集スクリプト
- [ ] レポートの定期生成・配信
