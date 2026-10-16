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

import fs from 'node:fs';
import path from 'node:path';
import { keepsShape } from '../../frontend/src/i18n/translationShape';

type Strings = Record<string, string>;

const LANGUAGE_CODE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

/**
 * Returns the strings of a catalog that can be used: non-empty strings with the
 * same placeholders and tags as their English key. The frontend applies the
 * same check.
 */
function usableStrings(value: unknown, file: string): Strings {
  const strings: Strings = {};
  const misshapen: string[] = [];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, text] of Object.entries(value)) {
      // An empty value is an untranslated string.
      if (typeof text !== 'string' || text === '') {
        continue;
      }
      if (keepsShape(key, text)) {
        strings[key] = text;
      } else {
        misshapen.push(key);
      }
    }
  }
  if (misshapen.length > 0) {
    console.warn(
      `Language pack catalog ${file}: skipped ${misshapen.length} translation(s) with placeholders or tags that differ from the English key:`,
      misshapen
    );
  }
  return strings;
}

/**
 * Reads the desktop app strings (Headlamp's `app` catalog) from the language
 * packs in a directory. The backend serves the same packs to the frontend.
 * Packs are read in alphabetical order, and strings in a later pack override
 * the same strings in an earlier pack.
 *
 * @param dir - The language packs directory. If it is not set or does not
 *   exist, no strings are returned.
 * @returns The `app` strings by lower-case language code.
 */
export function readLanguagePackAppStrings(dir: string | undefined): Map<string, Strings> {
  const byLanguage = new Map<string, Strings>();
  if (!dir) {
    return byLanguage;
  }
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return byLanguage;
  }

  for (const entry of entries
    .filter(e => e.isDirectory())
    .sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const packDir = path.join(dir, entry.name);
    const manifest = readJson(path.join(packDir, 'pack.json')) as
      | { language?: { code?: unknown } }
      | undefined;
    const code = manifest?.language?.code;
    if (typeof code !== 'string' || !LANGUAGE_CODE.test(code)) {
      continue;
    }
    const lng = code.toLowerCase();
    const appFile = path.join(packDir, 'headlamp', 'app.json');
    const strings = usableStrings(readJson(appFile), appFile);
    byLanguage.set(lng, { ...byLanguage.get(lng), ...strings });
  }
  return byLanguage;
}
