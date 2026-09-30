# my-resume

Vite + TypeScript(フレームワークなし)+ marked による、Markdown ベースの単一ページ紹介サイト。

- プロフィール・リンク(GitHub / X / Mail): `index.html`
- 各セクションの内容: `src/content.md`(`##` 見出しごとに1枚のカードになります)
  - 行頭の `**太字**` は、経歴系では日付、「登壇・勉強会・スタッフ」ではバッジ(登壇 / 参加 / スタッフ)として表示されます
- スタイル: `src/style.css`

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # dist/ に出力(main への push で GitHub Pages へ自動デプロイ)
```
