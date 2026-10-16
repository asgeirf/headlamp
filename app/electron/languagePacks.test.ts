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

import { createInstance } from 'i18next';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CURRENT_LOCALES, LOCALES_DIR } from './i18n-helper';
import { createJsonBackend } from './i18nextJsonBackend';
import { readLanguagePackAppStrings } from './languagePacks';

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function writePacks(files: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'headlamp-packs-'));
  tempDirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

describe('readLanguagePackAppStrings', () => {
  it('reads app strings by language, with later packs overriding earlier ones', () => {
    const dir = writePacks({
      'a-nb/pack.json': '{"language":{"code":"nb","label":"Norsk bokmål"}}',
      'a-nb/headlamp/app.json': '{"File":"Fil","Edit":"Rediger","Count":3,"Quit":""}',
      'b-nb/pack.json': '{"language":{"code":"NB"}}',
      'b-nb/headlamp/app.json': '{"Edit":"Endre"}',
      'de-terms/pack.json': '{"language":{"code":"de"}}',
      'broken/pack.json': '{',
      'bad-code/pack.json': '{"language":{"code":"../x"}}',
    });

    const strings = readLanguagePackAppStrings(dir);

    expect([...strings.keys()].sort()).toEqual(['de', 'nb']);
    expect(strings.get('nb')).toEqual({ File: 'Fil', Edit: 'Endre' });
    expect(strings.get('de')).toEqual({});
  });

  it('returns no strings for a missing directory', () => {
    expect(readLanguagePackAppStrings(path.join(os.tmpdir(), 'no-such-packs-dir')).size).toBe(0);
  });
});

describe('language packs in the menus', () => {
  it("adds a language and changes Headlamp's strings", async () => {
    const packStrings = readLanguagePackAppStrings(
      writePacks({
        'nb/pack.json': '{"language":{"code":"nb","label":"Norsk bokmål"}}',
        'nb/headlamp/app.json': '{"File":"Fil"}',
        'de/pack.json': '{"language":{"code":"de"}}',
        'de/headlamp/app.json':
          '{"File":"Akte","Edit":"","Do you want to install the plugin \\"{{ pluginName }}\\"?":"Installieren?"}',
      })
    );
    const i18n = createInstance();
    await i18n
      .use(
        createJsonBackend(LOCALES_DIR, (language, namespace) =>
          namespace === 'app' ? packStrings.get(language) : undefined
        )
      )
      .init({
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: [...new Set([...CURRENT_LOCALES, ...packStrings.keys()])],
        lowerCaseLng: true,
        ns: ['app'],
        defaultNS: 'app',
        returnEmptyString: false,
        nsSeparator: '|',
        keySeparator: false,
      });

    await i18n.changeLanguage('nb');
    expect(i18n.language).toBe('nb');
    expect(i18n.t('File')).toBe('Fil');
    expect(i18n.t('Edit')).toBe('Edit');

    await i18n.changeLanguage('de');
    expect(i18n.t('File')).toBe('Akte');
    expect(i18n.t('Edit')).toBe('Bearbeiten');
    // A translation without the {{ pluginName }} placeholder is skipped.
    expect(
      i18n.t('Do you want to install the plugin "{{ pluginName }}"?', { pluginName: 'x' })
    ).toContain('"x"');
  });
});
