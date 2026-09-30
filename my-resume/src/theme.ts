const root = document.documentElement;
const sw = document.querySelector<HTMLButtonElement>('#theme-toggle')!;

const apply = (theme: 'light' | 'dark') => {
  root.dataset.theme = theme;
  sw.setAttribute('aria-checked', String(theme === 'dark'));
};

apply(root.dataset.theme === 'dark' ? 'dark' : 'light');

sw.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  apply(next);
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* 保存できなくても切り替え自体は有効 */
  }
});

// 手動で選んだことがなければ、OS / ブラウザの設定変更(昼夜の自動切り替えなど)に追従する
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  try {
    if (localStorage.getItem('theme')) return;
  } catch {
    /* 読めない場合は追従する */
  }
  apply(e.matches ? 'dark' : 'light');
});
