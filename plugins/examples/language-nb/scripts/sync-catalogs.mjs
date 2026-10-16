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

// Brings each catalog in locales/<lang>/ into line with Headlamp's English
// catalogs, as `npm run i18n` does for the languages Headlamp includes: a key
// English gained is added with an empty value, a key English no longer has is
// removed, and the keys follow the English order. Translations are kept.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const englishDir = path.resolve(pluginDir, '../../../frontend/src/i18n/locales/en');
const localesDir = path.join(pluginDir, 'locales');

for (const lang of readdirSync(localesDir)) {
  for (const file of readdirSync(englishDir).filter(name => name.endsWith('.json'))) {
    const english = JSON.parse(readFileSync(path.join(englishDir, file), 'utf8'));
    const target = path.join(localesDir, lang, file);
    let current = {};
    try {
      current = JSON.parse(readFileSync(target, 'utf8'));
    } catch {
      // A catalog the language does not have yet starts empty.
    }

    const synced = {};
    for (const key of Object.keys(english)) {
      synced[key] = current[key] ?? '';
    }

    const added = Object.keys(synced).filter(key => !(key in current)).length;
    const removed = Object.keys(current).filter(key => !(key in synced)).length;
    writeFileSync(target, JSON.stringify(synced, null, 2) + '\n');
    console.log(`${lang}/${file}: ${added} added, ${removed} removed`);
  }
}
