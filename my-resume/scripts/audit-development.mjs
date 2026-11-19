import { spawnSync } from 'node:child_process';

// Production vulnerabilities are checked separately and remain blocking.
const result = spawnSync('npm', ['audit', '--json', '--audit-level=high'], { encoding: 'utf8' });
if (result.error || ![0, 1].includes(result.status)) {
  console.error('Could not run npm audit:', result.error ?? result.stderr);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error('npm audit returned an invalid report:', result.stderr || result.stdout);
  process.exit(1);
}

const vulnerabilities = report.metadata?.vulnerabilities;
if (report.error || !vulnerabilities || typeof vulnerabilities.high !== 'number' || typeof vulnerabilities.critical !== 'number') {
  console.error('npm audit failed:', report.error ?? 'missing vulnerability counts');
  process.exit(1);
}

const count = vulnerabilities.high + vulnerabilities.critical;
if ((result.status === 1) !== (count > 0)) {
  console.error('npm audit returned an unexpected exit status');
  process.exit(1);
}

if (count > 0) {
  console.log(`::warning::npm audit reported ${count} high or critical vulnerabilities; review the audit report and Dependabot alerts.`);
  console.log(JSON.stringify(report.vulnerabilities, null, 2));
} else {
  console.log('No high or critical dependency vulnerabilities found.');
}
