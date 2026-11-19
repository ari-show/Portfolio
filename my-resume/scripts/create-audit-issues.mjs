import { execFileSync, spawnSync } from 'node:child_process';

const audit = spawnSync('npm', ['audit', '--json', '--audit-level=high'], { encoding: 'utf8' });
if (audit.error || ![0, 1].includes(audit.status)) {
  throw new Error(`npm audit failed: ${audit.error ?? audit.stderr}`);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  throw new Error('npm audit returned invalid JSON');
}
const counts = report.metadata?.vulnerabilities;
if (report.error || !report.vulnerabilities || typeof counts?.high !== 'number' || typeof counts?.critical !== 'number') {
  throw new Error('npm audit returned an error or an incomplete report');
}
const count = counts.high + counts.critical;
if ((audit.status === 1) !== (count > 0)) throw new Error('npm audit returned an unexpected exit status');
if (!count) {
  console.log('No high or critical dependency vulnerabilities found.');
  process.exit(0);
}

const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities)) {
  for (const advisory of vulnerability.via) {
    if (typeof advisory !== 'object' || !['high', 'critical'].includes(advisory.severity)) continue;
    const id = String(advisory.source);
    if (!/^\d+$/.test(id)) throw new Error('Invalid npm advisory identifier');
    advisories.set(id, advisory);
  }
}
if (!advisories.size) throw new Error('High or critical vulnerabilities have no advisory details');

const pages = JSON.parse(execFileSync('gh', [
  'api', '--paginate', '--slurp', `repos/${process.env.GH_REPO}/issues?state=open&per_page=100`,
], { encoding: 'utf8' }));
const openIssues = pages.flat().filter((issue) => !issue.pull_request);

for (const [id, advisory] of advisories) {
  const marker = `<!-- npm-audit-advisory:${id} -->`;
  if (openIssues.some((issue) => issue.body?.includes(marker))) {
    console.log(`An open tracking issue already exists for npm advisory ${id}.`);
    continue;
  }
  // npm represents indirect effects as package-name strings in `via`.
  // Follow those links so the issue also explains which parent packages need attention.
  const affected = new Set();
  let changed;
  do {
    changed = false;
    for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
      if (affected.has(name)) continue;
      if (vulnerability.via.some((item) =>
        typeof item === 'string' ? affected.has(item) : String(item.source) === id,
      )) {
        affected.add(name);
        changed = true;
      }
    }
  } while (changed);

  const fixes = [...affected].sort().map((name) => {
    const fix = report.vulnerabilities[name].fixAvailable;
    if (fix === false) return `- ${name}: npm audit に自動修正案なし`;
    if (fix === true) return `- ${name}: npm audit に自動修正案あり（適用前に内容を確認）`;
    if (fix && typeof fix === 'object') return `- ${name}: ${fix.name}@${fix.version}（破壊的変更: ${fix.isSemVerMajor ? 'あり' : 'なし'}）`;
    return `- ${name}: npm audit に修正情報なし`;
  });

  const body = [
    marker,
    `${advisory.name} に high または critical の脆弱性が検出されました。`,
    '',
    `- パッケージ: ${advisory.name}`,
    `- 脆弱性の内容: ${advisory.title}（原文）`,
    `- 深刻度: ${advisory.severity}`,
    `- 影響範囲: ${advisory.range}`,
    `- 詳細: ${advisory.url}`,
    '',
    '### 影響を受ける依存関係と npm audit の修正案',
    ...fixes,
    '',
    '修正 PR を確認し、更新後に監査とビルドを再確認してください。修正版がない場合は対応状況を追跡します。',
    '修正後またはアドバイザリ撤回後に、この Issue を閉じてください。',
  ].join('\n');
  execFileSync('gh', ['issue', 'create', '--title', `依存関係 ${advisory.name} の脆弱性に対応`, '--body', body], { stdio: 'inherit' });
}
