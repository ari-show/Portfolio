# my-resume

Vite + TypeScript(フレームワークなし)+ marked による、Markdown ベースの単一ページ紹介サイト。

- 内容の編集: `src/content.md`(`##` 見出しごとにナビが自動生成されます)
- プロフィール部分: `index.html`
- スタイル: `src/style.css`

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # dist/ に出力(main への push で GitHub Pages へ自動デプロイ)
```
