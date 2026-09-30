const USER = 'ari-show';
const API = 'https://api.github.com';
const CACHE_KEY = 'gh-langs-v1';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 未認証APIは 60回/時 なので、結果を数時間キャッシュ
const MAX_REPOS = 30;
const MIN_SHARE = 0.02; // これ未満は Other にまとめる
const PALETTE = ['#2b56b8', '#d43a3a', '#9ec5ea', '#232a36', '#2f6fb5', '#e58b8b', '#6f8fd6', '#8a94a6'];

interface Repo { name: string; fork: boolean; archived: boolean; language: string | null }
type Bytes = Record<string, number>;

const getJSON = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
};

const loadCache = (): Bytes | null => {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    return c && Date.now() - c.t < CACHE_TTL ? (c.data as Bytes) : null;
  } catch {
    return null;
  }
};

const saveCache = (data: Bytes) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* ストレージ不可でも表示には影響しない */
  }
};

const fetchBytes = async (): Promise<Bytes> => {
  const repos = (await getJSON<Repo[]>(`/users/${USER}/repos?type=owner&sort=pushed&per_page=100`))
    .filter((r) => !r.fork && !r.archived)
    .slice(0, MAX_REPOS);

  const totals: Bytes = {};
  const results = await Promise.allSettled(repos.map((r) => getJSON<Bytes>(`/repos/${USER}/${r.name}/languages`)));
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const [lang, n] of Object.entries(r.value)) totals[lang] = (totals[lang] ?? 0) + n;
  }
  if (Object.keys(totals).length > 0) return totals;

  // レート制限などで言語APIが全滅した場合は、リポジトリの主言語数で代用する
  for (const r of repos) if (r.language) totals[r.language] = (totals[r.language] ?? 0) + 1;
  return totals;
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const render = (container: HTMLElement, bytes: Bytes) => {
  const sum = Object.values(bytes).reduce((a, b) => a + b, 0);
  if (sum === 0) return;

  const sorted = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
  const main = sorted.filter(([, n]) => n / sum >= MIN_SHARE);
  const other = sorted.filter(([, n]) => n / sum < MIN_SHARE).reduce((a, [, n]) => a + n, 0);
  const items = main.map(([name, n], i) => ({ name, share: n / sum, color: PALETTE[i % PALETTE.length] }));
  if (other > 0) items.push({ name: 'Other', share: other / sum, color: '#c5ccd6' });

  const card = el('section', 'card langs');
  card.dataset.name = '使用言語';
  card.append(el('h2', undefined, '使用言語'));

  const bar = el('div', 'lang-bar');
  bar.setAttribute('aria-hidden', 'true');
  const legend = el('ul', 'lang-legend');
  const segs: [HTMLElement, number][] = [];
  for (const it of items) {
    const seg = el('span', 'lang-seg');
    seg.style.background = it.color;
    seg.style.width = '0%';
    bar.append(seg);
    segs.push([seg, it.share * 100]);

    const li = el('li');
    const dot = el('i', 'lang-dot');
    dot.style.background = it.color;
    li.append(dot, el('span', undefined, it.name), el('em', undefined, `${(it.share * 100).toFixed(1)}%`));
    legend.append(li);
  }
  card.append(bar, legend, el('p', 'note', 'GitHub の公開リポジトリ(フォーク・アーカイブ除く)のコード量から算出'));
  container.append(card);

  // 追加直後に幅を伸ばして、バーが描画される動きを出す
  requestAnimationFrame(() => requestAnimationFrame(() => segs.forEach(([s, w]) => (s.style.width = `${w}%`))));
};

export const renderLanguages = async (container: HTMLElement) => {
  try {
    const cached = loadCache();
    const bytes = cached ?? (await fetchBytes());
    if (!cached) saveCache(bytes);
    render(container, bytes);
  } catch {
    /* 取得失敗時は何も表示しない(ページ本体には影響させない) */
  }
};
