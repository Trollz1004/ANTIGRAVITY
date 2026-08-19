import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { requestProviderBallot } from '../src/server/provider-ballot';

const outputPath = resolve(process.cwd(), 'docs/audit/gemini-nonproduction-ballot-audit.json');

const audit = await requestProviderBallot({
  ballotId: 'nonproduction-gemini-bridge-validation-20260819',
  proposal:
    'Validation only: confirm that Gemini can return one advisory decision through the direct official ballot bridge. This ballot changes no governance record, code, configuration, or deployment.',
  context: 'This is an isolated provider-path validation. The required response has no authority beyond proving the request and response contract.',
});

await mkdir(resolve(process.cwd(), 'docs/audit'), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
process.stdout.write(`status=${audit.status}\nprovider=${audit.executionProvider}\nmodel=${audit.executionModel}\n`);
process.exitCode = audit.status === 'completed' ? 0 : 1;
