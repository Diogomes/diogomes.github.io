#!/usr/bin/env node
/**
 * Resumo em Markdown de um relatório JSON do Playwright (reporter "json"),
 * para o $GITHUB_STEP_SUMMARY do workflow Quality.
 *
 * Uso: node scripts/playwright-summary.mjs test-results/results.json >> "$GITHUB_STEP_SUMMARY"
 */
import fs from 'node:fs';

const file = process.argv[2] || 'test-results/results.json';
if (!fs.existsSync(file)) {
  console.log(`### Playwright\n\nRelatório \`${file}\` não encontrado (a suíte chegou a rodar?).`);
  process.exit(0);
}
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const { expected = 0, unexpected = 0, flaky = 0, skipped = 0, duration = 0 } = report.stats || {};

// Contagem por projeto e lista de falhas/instáveis
const byProject = {};
const problems = [];
const walk = (suite, titles = []) => {
  const path = suite.title ? [...titles, suite.title] : titles;
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const p = (byProject[t.projectName] ||= { passed: 0, failed: 0, flaky: 0, skipped: 0 });
      const key = { expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' }[t.status] || 'failed';
      p[key]++;
      if (t.status === 'unexpected' || t.status === 'flaky') {
        problems.push(`| ${t.status === 'flaky' ? 'instável' : 'FALHOU'} | ${t.projectName} | ${[...path, spec.title].slice(1).join(' › ')} |`);
      }
    }
  }
  for (const child of suite.suites || []) walk(child, path);
};
for (const s of report.suites || []) walk(s);

const verdict = unexpected ? 'FALHOU' : flaky ? 'passou com instáveis' : 'passou';
const out = [
  `### Playwright (${verdict}): ${expected} ok, ${unexpected} falhas, ${flaky} instáveis, ${skipped} pulados (${(duration / 1000).toFixed(1)}s)`,
  '',
  '| Projeto | ok | falhas | instáveis | pulados |',
  '|---|---:|---:|---:|---:|',
  ...Object.entries(byProject).map(([n, p]) => `| ${n} | ${p.passed} | ${p.failed} | ${p.flaky} | ${p.skipped} |`),
];
if (problems.length) out.push('', '| Status | Projeto | Teste |', '|---|---|---|', ...problems.slice(0, 50));
out.push('', 'Relatório HTML completo no artifact **playwright-report**.');
console.log(out.join('\n'));
