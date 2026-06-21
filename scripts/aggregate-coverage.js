#!/usr/bin/env node
/**
 * Aggregate coverage summaries from all workspace packages into a single
 * coverage/coverage-summary.json at repo root with weighted overall lines%.
 * Exits non-zero if total.lines.pct < 90.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const COVERAGE_ROOT = path.join(ROOT, 'coverage');

function findCoverageSummaries(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findCoverageSummaries(full, results);
    } else if (entry.name === 'coverage-summary.json') {
      results.push(full);
    }
  }
  return results;
}

function mergeCoverage(summaryPaths) {
  const merged = {
    total: {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
    },
    packages: {},
  };

  for (const summaryPath of summaryPaths) {
    try {
      const content = fs.readFileSync(summaryPath, 'utf8');
      const data = JSON.parse(content);
      const pkgName = path.basename(path.dirname(path.dirname(summaryPath)));

      // Store per-package summary
      merged.packages[pkgName] = data.total || data;

      // Aggregate totals (weighted by lines.total)
      const total = data.total || data;
      if (total.lines) {
        merged.total.lines.total += total.lines.total || 0;
        merged.total.lines.covered += total.lines.covered || 0;
        merged.total.lines.skipped += total.lines.skipped || 0;
      }
      if (total.statements) {
        merged.total.statements.total += total.statements.total || 0;
        merged.total.statements.covered += total.statements.covered || 0;
        merged.total.statements.skipped += total.statements.skipped || 0;
      }
      if (total.functions) {
        merged.total.functions.total += total.functions.total || 0;
        merged.total.functions.covered += total.functions.covered || 0;
        merged.total.functions.skipped += total.functions.skipped || 0;
      }
      if (total.branches) {
        merged.total.branches.total += total.branches.total || 0;
        merged.total.branches.covered += total.branches.covered || 0;
        merged.total.branches.skipped += total.branches.skipped || 0;
      }
    } catch (e) {
      console.warn(`Warning: Could not parse ${summaryPath}:`, e.message);
    }
  }

  // Calculate percentages
  for (const key of ['lines', 'statements', 'functions', 'branches']) {
    if (merged.total[key].total > 0) {
      merged.total[key].pct = Math.round(
        (merged.total[key].covered / merged.total[key].total) * 10000
      ) / 100;
    }
  }

  return merged;
}

function main() {
  console.log('🔍 Searching for coverage-summary.json files...');
  const summaryPaths = findCoverageSummaries(COVERAGE_ROOT);

  if (summaryPaths.length === 0) {
    console.error('❌ No coverage-summary.json files found in coverage/');
    console.error('   Ensure vitest is run with --coverage and coverageDirectory set.');
    process.exit(1);
  }

  console.log(`📊 Found ${summaryPaths.length} coverage summary file(s):`);
  for (const p of summaryPaths) {
    console.log(`   - ${p}`);
  }

  const merged = mergeCoverage(summaryPaths);

  // Write aggregated summary to repo root coverage/
  const outputDir = path.join(ROOT, 'coverage');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'coverage-summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`\n✅ Aggregated coverage written to ${outputPath}`);

  // Print summary
  console.log('\n📈 Coverage Summary:');
  console.log('─'.repeat(50));
  for (const [pkg, data] of Object.entries(merged.packages)) {
    const linesPct = data.lines?.pct ?? 0;
    console.log(`  ${pkg}: ${linesPct}% lines (${data.lines?.covered ?? 0}/${data.lines?.total ?? 0})`);
  }
  console.log('─'.repeat(50));
  const overallLinesPct = merged.total.lines.pct;
  console.log(`  TOTAL: ${overallLinesPct}% lines (${merged.total.lines.covered}/${merged.total.lines.total})`);

  // Enforce 90% gate
  if (overallLinesPct < 90) {
    console.error(`\n❌ FAIL: Overall line coverage ${overallLinesPct}% is below 90% threshold`);
    process.exit(1);
  }

  console.log(`\n✅ PASS: Overall line coverage ${overallLinesPct}% meets 90% threshold`);
  process.exit(0);
}

main();