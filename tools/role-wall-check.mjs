import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve, join } from 'node:path';

const root = resolve(process.argv[2] ?? '..');
const scanRoots = ['server/src', 'client/src', 'scripts', 'server/data'];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.cmd', '.ps1', '.sh', '.json']);
const retiredIdentifier = ['f', 'cc'].join('');
const prohibitedKeyName = ['ANTHROPIC', 'API', 'KEY'].join('_');
const sourceFiles = [];

function walk(path) {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (sourceExtensions.has(full.slice(full.lastIndexOf('.')))) sourceFiles.push(full);
  }
}

for (const relative of scanRoots) walk(join(root, relative));

const violations = [];
const officialVoteName = /^official-vote.*\.(ts|tsx|js)$/;
const importViolation = /(?:from\s+|import\s+)['"]\.\/(bridge|omniroute)\.js['"]/;
const mutationPattern = /git\s+(push|merge|branch\s+.*(?:-d|--delete))/i;
// Also catch the retired identifier spelled out longhand, which a literal scan misses.
const retiredPattern = new RegExp(`${retiredIdentifier}|free[ -]?claude`, 'i');
const prohibitedKeyPattern = new RegExp(`${prohibitedKeyName}|sk-ant-[A-Za-z0-9_-]+`);

for (const file of sourceFiles) {
  if (/\.(test|spec)\.(ts|tsx|js|mjs|cjs)$/.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  const relative = file.slice(root.length + 1).replaceAll('\\', '/');
  if (officialVoteName.test(basename(file)) && importViolation.test(source)) {
    violations.push(`${relative}: official vote module imports a general routing module`);
  }
  if (retiredPattern.test(source)) violations.push(`${relative}: retired bridge identifier`);
  if (prohibitedKeyPattern.test(source)) violations.push(`${relative}: prohibited key pattern`);
  if (mutationPattern.test(source)) violations.push(`${relative}: harness-reachable git mutation command`);
}

if (violations.length > 0) {
  console.error('ROLE WALL VIOLATION');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Role wall passed: ${sourceFiles.length} source files scanned.`);
