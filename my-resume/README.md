# my-resume

Vite + TypeScript(フレームワークなし)+ marked による、Markdown ベースの単一ページ紹介サイト。

- プロフィール・リンク(GitHub / X / Mail): `index.html`
- 各セクションの内容: `src/content.md`(`##` 見出しごとに1枚のカードになります)
  - 行頭の `**太字**` は日付として表示されます。「登壇・勉強会・スタッフ」は `###` 見出し(登壇 / スタッフ / 参加)ごとにバッジ表示されます
- スタイル: `src/style.css`(ライト/ダークは `:root[data-theme]` の変数で切り替え。ダークはターミナル風)
- テーマ切り替え: `src/theme.ts`(初回は OS の設定に従い、選択は `localStorage` に保存)

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # dist/ に出力(main への push で GitHub Pages へ自動デプロイ)
```
