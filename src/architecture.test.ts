import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Enforces the dependency rule from ARCHITECTURE.md. An import that crosses a boundary the wrong way fails the build.

const SRC = dirname(fileURLToPath(import.meta.url));
const walk = (d: string): string[] => readdirSync(d).flatMap(n => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const sources = walk(SRC).filter(f => /\.(ts|tsx)$/.test(f) && !f.endsWith('architecture.test.ts'));

// Real module references only: line-leading import/export-from, side-effect imports, module augmentation, dynamic import().
const PATTERNS = [
  /^\s*(?:import|export)\s[^;'"]*?\sfrom\s*['"]([^'"]+)['"]/gm,
  /^\s*import\s*['"]([^'"]+)['"]/gm,
  /^\s*declare module\s*['"]([^'"]+)['"]/gm,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];
const imports = (file: string): readonly string[] => {
  const text = readFileSync(file, 'utf8');
  return PATTERNS.flatMap(re => [...text.matchAll(re)].map(m => m[1] as string));
};

/** "domain/curriculum", "presentation", "main", … for a path inside src. */
const zone = (rel: string): string => {
  const [a, b] = rel.split('/');
  return a === 'domain' && b ? `domain/${b}` : (a ?? '').replace(/\.(tsx?)$/, '');
};
const layer = (z: string): string => z.split('/')[0] ?? z;

// layer → layers it may import
const LAYER_RULES: Readonly<Record<string, readonly string[]>> = {
  domain: ['domain'],
  application: ['domain', 'application'],
  infrastructure: ['domain', 'application', 'infrastructure'],
  presentation: ['domain', 'application', 'presentation'],
  main: ['domain', 'application', 'infrastructure', 'presentation'],
  'test-setup': [],
};

// bounded context → contexts it may import (within the domain)
const CONTEXT_RULES: Readonly<Record<string, readonly string[]>> = {
  'domain/shared-kernel': [],
  'domain/review': ['domain/shared-kernel'],
  'domain/preferences': [],
  'domain/simulation': ['domain/shared-kernel'],
  'domain/curriculum': ['domain/shared-kernel', 'domain/simulation'],
  'domain/learning': ['domain/shared-kernel', 'domain/curriculum', 'domain/review'],
};

const EXTERNAL_ALLOWED: Readonly<Record<string, readonly string[]>> = {
  domain: [],                              // pure: no libraries at all
  application: [],
  infrastructure: ['zod'],
  presentation: ['react', 'react-dom', 'zod', '@testing-library'],
  main: ['react', 'react-dom'],
};

const isTest = (f: string) => /\.test\.tsx?$/.test(f) || f.includes('/testing/');

describe('architecture', () => {
  it('finds source files', () => { expect(sources.length).toBeGreaterThan(100); });

  it.each(sources.map(f => [relative(SRC, f), f] as const))('%s respects the dependency rule', (rel, file) => {
    const from = zone(rel), fromLayer = layer(from);
    const allowedLayers = LAYER_RULES[fromLayer];
    expect(allowedLayers, `unknown layer for ${rel}`).toBeDefined();
    const test = isTest(rel);
    const violations: string[] = [];
    for (const spec of imports(file)) {
      if (spec.startsWith('.')) {
        const target = relative(SRC, resolve(dirname(file), spec));
        const to = zone(target);
        if (!allowedLayers?.includes(layer(to)) && !(test && layer(to) === 'application' && fromLayer !== 'domain')) violations.push(`${spec} (${layer(to)} layer)`);
        if (fromLayer === 'domain' && layer(to) === 'domain' && from !== to) {
          const ok = CONTEXT_RULES[from] ?? [];
          // simulation signal declarations augment curriculum's LabSignals
          const signalAugmentation = from === 'domain/simulation' && to === 'domain/curriculum' && rel.endsWith('/signal.ts');
          // tests may look across contexts
          if (!ok.includes(to) && !signalAugmentation && !test) violations.push(`${spec} (context ${to})`);
        }
      } else if (!spec.startsWith('node:') && !['vitest', 'vitest/config'].includes(spec)) {
        const allowed = EXTERNAL_ALLOWED[fromLayer] ?? [];
        if (!allowed.some(a => spec === a || spec.startsWith(`${a}/`))) violations.push(`${spec} (external)`);
      }
    }
    expect(violations).toEqual([]);
  });
});
