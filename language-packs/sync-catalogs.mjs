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

// Updates the catalogs in every pack to match the English catalogs in
// sources.json, in the same way that `npm run i18n` updates the languages
// Headlamp includes: new English keys are added with empty values, keys that
// are no longer in English are removed, and the keys are sorted in the English
// order. Existing translations are kept. Run the script after Headlamp or a
// plugin changes its English strings, and before translating, because kapi
// writes translations only into keys that already exist in the catalog.
//
//   node language-packs/sync-catalogs.mjs

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packsDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(packsDir, '..');
const sources = JSON.parse(readFileSync(path.join(packsDir, 'sources.json'), 'utf8'));

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    // A catalog that does not exist yet starts empty.
    return {};
  }
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
  mkdirSync(path.dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, JSON.stringify(synced, null, 2) + '\n');
  console.log(`${path.relative(packsDir, targetFile)}: ${added} added, ${removed} removed`);
}

const packs = readdirSync(packsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(path.join(packsDir, entry.name, 'pack.json')))
  .map(entry => path.join(packsDir, entry.name));

const headlampDir = path.join(repoDir, sources.headlamp);
for (const pack of packs) {
  for (const file of readdirSync(headlampDir).filter(name => name.endsWith('.json'))) {
    sync(path.join(headlampDir, file), path.join(pack, 'headlamp', file));
  }
  for (const [plugin, englishFile] of Object.entries(sources.plugins ?? {})) {
    sync(path.join(repoDir, englishFile), path.join(pack, 'plugins', plugin, 'translation.json'));
  }
}
