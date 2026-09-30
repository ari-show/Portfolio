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
