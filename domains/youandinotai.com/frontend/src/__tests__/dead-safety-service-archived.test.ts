import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..');
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src');
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..', '..', '..');
const ARCHIVE_ROOT = path.join(
  REPO_ROOT,
  'archive',
  '2026-11-21-youandinotai-dead-safety-service'
);

const DEAD_SAFETY_FILES = [
  'src/lib/safetyService.ts',
  'src/app/components/SAFETY_IMPLEMENTATION_GUIDE.md',
  'src/app/components/enhanced-index.ts',
  'src/app/components/EnhancedSafetyDrawer.tsx',
  'src/app/components/EnhancedBlockConfirmationDialog.tsx',
  'src/app/components/EnhancedReportForm.tsx',
  'src/app/components/EnhancedSafetyTipBanner.tsx',
] as const;

const DEAD_BASENAMES = new Set(
  DEAD_SAFETY_FILES.map(relPath => path.posix.basename(relPath))
);

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

describe('dead safetyService and unimported Enhanced* safety files are archived', () => {
  it('keeps none of the dead safety files in the active domains/youandinotai.com/frontend/src tree', () => {
    const presentAtExactPaths = DEAD_SAFETY_FILES.filter(relPath =>
      existsSync(path.join(FRONTEND_ROOT, relPath))
    );
    expect(presentAtExactPaths).toEqual([]);

    const presentAnywhereInSrc = walkFiles(SRC_ROOT)
      .filter(filePath => DEAD_BASENAMES.has(path.basename(filePath)))
      .map(filePath =>
        path.relative(FRONTEND_ROOT, filePath).replaceAll('\\', '/')
      );
    expect(presentAnywhereInSrc).toEqual([]);
  });

  it('preserves the seven archived safety files under archive/2026-11-21-youandinotai-dead-safety-service', () => {
    const missingFromArchive = DEAD_SAFETY_FILES.filter(
      relPath => !existsSync(path.join(ARCHIVE_ROOT, relPath))
    );
    expect(missingFromArchive).toEqual([]);
  });

  it('removes the socket.io-client module stub from src/vite-env.d.ts', () => {
    const viteEnvPath = path.join(SRC_ROOT, 'vite-env.d.ts');
    const content = readFileSync(viteEnvPath, 'utf8');
    expect(content).toContain('/// <reference types="vite/client" />');
    expect(content).not.toMatch(/socket\.io-client/);
    expect(content).not.toMatch(/declare\s+module\s+['"]socket\.io-client['"]/);
  });
});
