import { createHash } from 'node:crypto';

const token = process.argv[2];

if (!token) {
  console.error('Usage: npm run token:hash -- "<raw-token>"');
  process.exit(1);
}

const hash = createHash('sha256').update(token, 'utf8').digest('hex');
console.log(`sha256:${hash}`);
