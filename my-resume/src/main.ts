import { marked } from 'marked';
import md from './content.md?raw';
import './style.css';

const content = document.querySelector<HTMLElement>('#content')!;

content.innerHTML = marked.parse(md, { async: false });

// 各 h2 とその直後の要素を1枚のカード(section)にまとめる
const cards: HTMLElement[] = [];
content.querySelectorAll('h2').forEach((h) => {
  const card = document.createElement('section');
  card.className = 'card';
  card.dataset.name = h.textContent ?? '';
  let node: Element | null = h.nextElementSibling;
  card.append(h);
  while (node && node.tagName !== 'H2') {
    const next: Element | null = node.nextElementSibling;
    card.append(node);
    node = next;
  }
  cards.push(card);
});
content.replaceChildren(...cards);
content.querySelectorAll('h3').forEach((h) => {
  h.dataset.kind = h.textContent ?? '';
});

document.querySelector('#year')!.textContent = String(new Date().getFullYear());

// 背景の三角(赤・青・水色を大小さまざまに、固定シードで毎回同じ配置)
const bg = document.querySelector<HTMLElement>('#bg')!;
const colors = ['#d43a3a', '#2b56b8', '#d43a3a', '#2b56b8', '#9ec5ea'];
let seed = 2107;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const between = (a: number, b: number) => a + rand() * (b - a);
const addTriangle = (xMin: number, xMax: number) => {
  const tri = document.createElement('i');
  const sign = rand() < 0.5 ? -1 : 1;
  const vars: Record<string, string> = {
    '--x': `${between(xMin, xMax)}%`,
    '--y': `${between(-2, 96)}%`,
    '--s': `${Math.round(between(14, 96))}px`,
    '--c': colors[Math.floor(rand() * colors.length)],
    '--o': between(0.18, 0.5).toFixed(2),
    '--r': `${Math.round(between(0, 360))}deg`,
    '--spin': `${sign * Math.round(between(30, 120))}deg`,
    '--dx': `${Math.round(between(-40, 40))}px`,
    '--dy': `${Math.round(between(-60, 60))}px`,
    '--d': `${between(7, 16).toFixed(1)}s`,
    '--delay': `-${between(0, 12).toFixed(1)}s`,
  };
  for (const [k, v] of Object.entries(vars)) tri.style.setProperty(k, v);
  bg.append(tri);
};
for (let i = 0; i < 26; i++) addTriangle(-2, 98);
// 右側が寂しくならないよう、右寄りに追加
for (let i = 0; i < 12; i++) addTriangle(62, 98);

// 本体の描画が終わってから、言語使用率を非同期に取得・描画する
const loadLanguages = () => {
  const run = () => import('./languages').then((m) => m.renderLanguages(content));
  'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 3000 }) : setTimeout(run, 500);
};
document.readyState === 'complete' ? loadLanguages() : window.addEventListener('load', loadLanguages, { once: true });
