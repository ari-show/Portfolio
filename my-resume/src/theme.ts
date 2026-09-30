const root = document.documentElement;
const btn = document.querySelector<HTMLButtonElement>('#theme-toggle')!;

const apply = (theme: 'light' | 'dark') => {
  root.dataset.theme = theme;
  btn.setAttribute('aria-pressed', String(theme === 'dark'));
  btn.setAttribute('aria-label', theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
};

apply(root.dataset.theme === 'dark' ? 'dark' : 'light');

btn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  apply(next);
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* 保存できなくても切り替え自体は有効 */
  }
});
