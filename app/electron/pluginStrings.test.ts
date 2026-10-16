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

import { createInstance, i18n } from 'i18next';
import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_LOCALES, LOCALES_DIR } from './i18n-helper';
import { createJsonBackend } from './i18nextJsonBackend';
import { applyPluginStrings } from './pluginStrings';

// Uses the configuration from i18next.config.ts, with a new instance for each test.
async function createI18n() {
  const instance = createInstance();
  await instance.use(createJsonBackend(LOCALES_DIR)).init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: [...CURRENT_LOCALES],
    lowerCaseLng: true,
    ns: ['app'],
    defaultNS: 'app',
    returnEmptyString: false,
    nsSeparator: '|',
    keySeparator: false,
  });
  return instance;
}

describe('applyPluginStrings', () => {
  let i18n: i18n;

  beforeEach(async () => {
    i18n = await createI18n();
  });

  it('changes English strings and reports that the current language changed', async () => {
    expect(await applyPluginStrings(i18n, { en: { File: 'Archive' } })).toBe(true);
    expect(i18n.t('File')).toBe('Archive');
    expect(i18n.t('Edit')).toBe('Edit');
  });

  it('removes strings that are not in a later message', async () => {
    await applyPluginStrings(i18n, { en: { File: 'Archive', Edit: 'Change' } });
    await applyPluginStrings(i18n, { en: { Edit: 'Change' } });
    expect(i18n.t('File')).toBe('File');
    expect(i18n.t('Edit')).toBe('Change');
    await applyPluginStrings(i18n, { en: {} });
    expect(i18n.t('Edit')).toBe('Edit');
  });

  it("keeps Headlamp's strings in a language that was not loaded", async () => {
    expect(await applyPluginStrings(i18n, { DE: { File: 'Akte' } })).toBe(false);
    await i18n.changeLanguage('de');
    expect(i18n.t('File')).toBe('Akte');
    expect(i18n.t('Edit')).toBe('Bearbeiten');
  });

  it('adds a language Headlamp does not include', async () => {
    await applyPluginStrings(i18n, { xx: { File: 'File (xx)' } });
    await i18n.changeLanguage('xx');
    expect(i18n.language).toBe('xx');
    expect(i18n.t('File')).toBe('File (xx)');
    expect(i18n.t('Edit')).toBe('Edit');
  });

  it('ignores malformed messages', async () => {
    const supported = [...(i18n.options.supportedLngs || [])];
    for (const message of [
      null,
      'en',
      ['en'],
      { '../en': { File: 'x' } },
      { en: { File: 1 } },
      { en: ['x'] },
    ]) {
      expect(await applyPluginStrings(i18n, message)).toBe(false);
    }
    expect(i18n.options.supportedLngs).toEqual(supported);
    expect(i18n.t('File')).toBe('File');
  });
});
