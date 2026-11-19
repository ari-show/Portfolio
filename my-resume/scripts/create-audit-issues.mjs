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
  const body = [
    marker,
    'npm audit が high または critical の脆弱性を検出しました。',
    '',
    `- パッケージ: ${advisory.name}`,
    `- 深刻度: ${advisory.severity}`,
    `- 影響範囲: ${advisory.range}`,
    `- 詳細: ${advisory.url}`,
    '',
    'Dependabot の修正 PR を確認してください。修正版がない場合は公開後に依存関係を更新し、監査とビルドを再確認してください。',
    '対応後、またはアドバイザリが撤回された場合は、この Issue を閉じてください。',
  ].join('\n');
  execFileSync('gh', ['issue', 'create', '--title', `[Security] ${advisory.name}: ${advisory.title}`, '--body', body], { stdio: 'inherit' });
}
