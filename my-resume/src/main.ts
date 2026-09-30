import { marked } from 'marked';
import md from './content.md?raw';
import './style.css';

const content = document.querySelector<HTMLElement>('#content')!;
const nav = document.querySelector<HTMLElement>('#nav')!;

content.innerHTML = marked.parse(md, { async: false });

// 各 h2 にアンカーIDを付け、ナビを自動生成する
content.querySelectorAll('h2').forEach((h, i) => {
  h.id = `section-${i + 1}`;
  const a = document.createElement('a');
  a.href = `#${h.id}`;
  a.textContent = h.textContent;
  nav.append(a);
});

document.querySelector('#year')!.textContent = String(new Date().getFullYear());
