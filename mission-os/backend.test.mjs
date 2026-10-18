import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('./server.mjs', import.meta.url), 'utf8');
test('startup does not fabricate health or versions', () => {
 assert.doesNotMatch(source, /listening: true|version: 'agy 1\.4\.0'|version: 'Claude Code 2\.1\.278'/);
});
test('dispatch never bypasses permissions or passes user input into cmd', () => {
 assert.doesNotMatch(source, /--dangerously-skip-permissions|--always-approve/);
 assert.doesNotMatch(source, /spawn\(isCmd \? 'cmd.exe'/);
});
test('server is loopback-only and guards request origin', () => {
 assert.doesNotMatch(source, /\.listen\(PORT, '0\.0\.0\.0'/);
 assert.match(source, /guardRequest\(req/);
});
