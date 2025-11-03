#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const TARGET_DIRECTORIES = ['src', path.join('client', 'src')];
const FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const RESOLVE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json'];
const INDEX_CANDIDATES = RESOLVE_EXTENSIONS.map((ext) => path.join('index' + ext));
const IGNORED_DIRS = new Set(['node_modules', '.git', 'build', 'dist']);

async function main() {
  const root = process.cwd();
  const files = (await Promise.all(
    TARGET_DIRECTORIES.map((rel) => collectFiles(path.join(root, rel)))
  ))
    .flat()
    .filter(Boolean);

  const edges = new Set();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const from = toPosix(path.relative(root, file));

    for (const specifier of extractSpecifiers(content)) {
      if (!specifier.startsWith('.')) continue;

      const resolved = await resolveImport(file, specifier);
      if (!resolved) continue;

      const to = toPosix(path.relative(root, resolved));
      edges.add(`${from} -> ${to}`);
    }
  }

  const sortedEdges = Array.from(edges).sort((a, b) => a.localeCompare(b));
  for (const line of sortedEdges) {
    console.log(line);
  }
}

async function collectFiles(dir) {
  try {
    const stats = await fs.stat(dir);
    if (!stats.isDirectory()) return [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(fullPath)));
    } else if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

function extractSpecifiers(content) {
  const specifiers = new Set();

  const importRegex = /import\s+[^'";]*?['\"]([^'\"]+)['\"];?/g;
  const requireRegex = /require\(\s*['\"]([^'\"]+)['\"]\s*\)/g;

  for (const match of content.matchAll(importRegex)) {
    specifiers.add(match[1]);
  }

  for (const match of content.matchAll(requireRegex)) {
    specifiers.add(match[1]);
  }

  return specifiers;
}

async function resolveImport(fromFile, specifier) {
  const fromDir = path.dirname(fromFile);
  const rawPath = path.resolve(fromDir, specifier);

  const candidates = [rawPath, ...RESOLVE_EXTENSIONS.map((ext) => rawPath + ext)];

  if (!path.extname(rawPath)) {
    for (const indexCandidate of INDEX_CANDIDATES) {
      candidates.push(path.join(rawPath, indexCandidate));
    }
  }

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isFile()) {
        return candidate;
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  return null;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
