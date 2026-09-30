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

document.querySelector('#year')!.textContent = String(new Date().getFullYear());
