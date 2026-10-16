/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Extracts the English strings that the language packs translate, and updates
// the catalogs in every pack to match them.
//
// For each plugin in sources.json, the English strings are the plugin's
// catalog, the labels of the sidebar entries that its code registers, and any
// extra keys listed for the plugin. They are written to
// source/plugins/<name>/translation.json, which kapi.yaml uses as the plugin's
// source. Headlamp's English catalogs are read from the path in sources.json.
//
// The script then updates each pack in the same way that `npm run i18n`
// updates the languages Headlamp includes: new English keys are added with
// empty values, keys that are no longer in English are removed, and the keys
// are sorted in the English order. Existing translations are kept. Run the
// script after Headlamp or a plugin changes its English strings, and before
// translating, because kapi writes translations only into keys that already
// exist in the catalog.
//
//   node language-packs/sync-catalogs.mjs

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packsDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(packsDir, '..');
const sourceDir = path.join(packsDir, 'source');
// The paths in sources.json can point outside the repository, for example to
// plugin releases stored elsewhere. The file is maintainer configuration.
const sources = JSON.parse(readFileSync(path.join(packsDir, 'sources.json'), 'utf8'));

// An npm package name, which Headlamp uses to identify a plugin. The name is
// validated before it is used in a path.
const PACKAGE_NAME = /^(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/i;

function writeJson(file, value) {
  const resolved = path.resolve(file);
  if (!resolved.startsWith(packsDir + path.sep)) {
    throw new Error(`refusing to write outside ${packsDir}: ${resolved}`);
  }
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, JSON.stringify(value, null, 2) + '\n');
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    // A catalog that does not exist yet starts empty.
    return {};
  }
}

// Returns the plugin code files: source files, or a plugin's built main.js.
function* codeFiles(target) {
  if (!existsSync(target)) {
    console.warn(`${path.relative(repoDir, target)}: not found`);
    return;
  }
  if (statSync(target).isFile()) {
    yield target;
    return;
  }
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      yield* codeFiles(full);
    } else if (/\.(m?js|jsx|tsx?)$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) {
      yield full;
    }
  }
}

// Returns the index after the closing quote of the string literal at `start`.
function skipString(code, start) {
  const quote = code[start];
  let i = start + 1;
  while (i < code.length && code[i] !== quote) {
    i += code[i] === '\\' ? 2 : 1;
  }
  return i + 1;
}

const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

// Returns the value of a string literal, or undefined for a template with ${…}.
function literalValue(raw) {
  const body = raw.slice(1, -1);
  if (raw[0] === '`' && body.includes('${')) {
    return undefined;
  }
  return body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/gs, (_, esc) => {
    if (esc[0] === 'u' || esc[0] === 'x') {
      return String.fromCodePoint(parseInt(esc.replace(/[ux{}]/g, ''), 16));
    }
    return ESCAPES[esc] ?? esc;
  });
}

// Returns the label of the object literal at `start`, if the label is a string
// literal. A label that is computed at run time cannot be read from the code.
function labelOf(code, start) {
  let depth = 0;
  let expectKey = true;
  for (let i = start; i < code.length; ) {
    const char = code[i];
    if (char === '/' && (code[i + 1] === '/' || code[i + 1] === '*')) {
      const end = code[i + 1] === '/' ? code.indexOf('\n', i) : code.indexOf('*/', i) + 1;
      i = end <= 0 ? code.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      i = skipString(code, i);
      expectKey = false;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') {
      depth++;
      expectKey = char === '{' && depth === 1;
    } else if (char === '}' || char === ']' || char === ')') {
      depth--;
      if (depth === 0) {
        return undefined;
      }
    } else if (char === ',' && depth === 1) {
      expectKey = true;
    } else if (depth === 1 && expectKey) {
      const match = /^label\s*:\s*/.exec(code.slice(i, i + 40));
      if (match) {
        const valueStart = i + match[0].length;
        if (!`"'\``.includes(code[valueStart])) {
          return undefined;
        }
        return literalValue(code.slice(valueStart, skipString(code, valueStart)));
      }
      if (!/\s/.test(char)) {
        expectKey = false;
      }
    }
    i++;
  }
  return undefined;
}

/** Returns the string literal labels of the registerSidebarEntry calls in the code. */
function sidebarLabels(targets) {
  const labels = new Set();
  const call = /registerSidebarEntry\)?\s*\(\s*\{/g;
  for (const target of targets) {
    for (const file of codeFiles(path.resolve(repoDir, target))) {
      const code = readFileSync(file, 'utf8');
      for (const match of code.matchAll(call)) {
        const label = labelOf(code, match.index + match[0].length - 1);
        if (label) {
          labels.add(label);
        }
      }
    }
  }
  return [...labels];
}

// A plugin in sources.json is either the path of its English catalog, or
// { catalog, code, keys }: the catalog, the code to read sidebar labels from,
// and keys that cannot be read from the code, such as computed labels.
function pluginEnglish(name, source) {
  const {
    catalog,
    code = [],
    keys = [],
  } = typeof source === 'string' ? { catalog: source } : source;
  const english = catalog ? readJson(path.resolve(repoDir, catalog)) : {};
  const labels = sidebarLabels(Array.isArray(code) ? code : [code]);
  for (const key of [...labels, ...keys]) {
    english[key] ??= key;
  }
  const file = path.join(sourceDir, 'plugins', name, 'translation.json');
  writeJson(file, english);
  console.log(
    `${path.relative(packsDir, file)}: ${Object.keys(english).length} strings, ${
      labels.length
    } sidebar labels`
  );
  return file;
}

function sync(englishFile, targetFile) {
  const english = readJson(englishFile);
  const current = readJson(targetFile);
  const synced = {};
  for (const key of Object.keys(english)) {
    synced[key] = current[key] ?? '';
  }
  const added = Object.keys(synced).filter(key => !(key in current)).length;
  const removed = Object.keys(current).filter(key => !(key in synced)).length;
  writeJson(targetFile, synced);
  console.log(`${path.relative(packsDir, targetFile)}: ${added} added, ${removed} removed`);
}

for (const name of Object.keys(sources.plugins ?? {})) {
  if (!PACKAGE_NAME.test(name)) {
    throw new Error(`sources.json: "${name}" is not a package name`);
  }
}

const pluginSources = Object.entries(sources.plugins ?? {}).map(([name, source]) => [
  name,
  pluginEnglish(name, source),
]);

const packs = readdirSync(packsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(path.join(packsDir, entry.name, 'pack.json')))
  .map(entry => path.join(packsDir, entry.name));

const headlampDir = path.resolve(repoDir, sources.headlamp);
for (const pack of packs) {
  for (const file of readdirSync(headlampDir).filter(name => name.endsWith('.json'))) {
    sync(path.join(headlampDir, file), path.join(pack, 'headlamp', file));
  }
  for (const [name, englishFile] of pluginSources) {
    sync(englishFile, path.join(pack, 'plugins', name, 'translation.json'));
  }
}
