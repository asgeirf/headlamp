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

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getTableLocalization } from '../components/common/Table/tableLocalization';
import i18next, { supportedLanguages } from './config';
import { getPackPluginLanguages, getPackPluginStrings } from './languagePackCatalogs';
import { addLanguagePacks, LanguagePack, loadLanguagePacks } from './languagePacks';
import { getRegisteredLocale } from './localeRegistry';
import { addLocale } from './registerLocale';

// The files in the packs below, by the end of their URL.
const files: Record<string, Record<string, string>> = {
  'language-packs/test-xy/headlamp/translation.json': { Close: 'Close (xy)' },
  'language-packs/test-xy/plugins/%40scope/plugin/translation.json': { Hello: 'Hello (xy)' },
  'language-packs/test-de/headlamp/translation.json': { Close: 'Zu', Delete: 'Weg', Cancel: '' },
  'language-packs/test-en/headlamp/glossary.json': { Namespaces: 'Projects' },
};

function fakeFetch(url: string) {
  const path = Object.keys(files).find(key => String(url).endsWith(key));
  return Promise.resolve({
    ok: !!path,
    status: path ? 200 : 404,
    json: async () => (path ? files[path] : {}),
  });
}

const packs: LanguagePack[] = [
  {
    name: 'test-xy',
    manifest: { language: { code: 'xy', label: 'Test Y' }, muiLocale: 'fiFI', tableLocale: 'fi' },
    files: ['headlamp/translation.json', 'plugins/@scope/plugin/translation.json'],
  },
  {
    name: 'test-de',
    manifest: { language: { code: 'DE' } },
    files: ['headlamp/translation.json'],
  },
  {
    name: 'test-en',
    manifest: { language: { code: 'en' } },
    files: ['headlamp/glossary.json'],
  },
  { name: 'no-label', manifest: { language: { code: 'yz' } }, files: [] },
  { name: 'bad-code', manifest: { language: { code: '../x', label: 'X' } }, files: [] },
];

describe('addLanguagePacks', () => {
  beforeAll(async () => {
    vi.stubGlobal('fetch', vi.fn(fakeFetch));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await i18next.changeLanguage('en');
    expect(i18next.hasResourceBundle('en', 'glossary')).toBe(true);
    expect(i18next.hasResourceBundle('de', 'translation')).toBe(false);
    await addLanguagePacks(packs);
  });

  afterAll(async () => {
    await i18next.changeLanguage('en');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('adds a language Headlamp does not include', async () => {
    expect(supportedLanguages.xy).toEqual({ label: 'Test Y', dir: 'ltr' });
    expect(supportedLanguages).not.toHaveProperty('yz');
    expect(Object.keys(supportedLanguages)).not.toContain('../x');

    await i18next.changeLanguage('xy');
    expect(i18next.resolvedLanguage).toBe('xy');
    expect(i18next.t('Close')).toBe('Close (xy)');
    // Keys and namespaces that are not in the pack are shown in English.
    expect(i18next.t('Cancel')).toBe('Cancel');
    expect(i18next.t('glossary|Pods')).toBe('Pods');
  });

  it("loads the language's Material UI and table strings by name", async () => {
    await i18next.changeLanguage('xy');
    await vi.waitFor(() => expect(getRegisteredLocale('xy')?.tableLocalization).toBeDefined());
    expect(getRegisteredLocale('xy')?.muiLocale).toBeDefined();
    expect(getTableLocalization('xy')).toBe(getRegisteredLocale('xy')?.tableLocalization);
  });

  it("changes Headlamp's strings in a language that is not loaded yet", async () => {
    expect(supportedLanguages).not.toHaveProperty('DE');
    await i18next.changeLanguage('de');
    expect(i18next.t('Close')).toBe('Zu');
    expect(i18next.t('Cancel')).toBe('Abbrechen');
  });

  it('changes the strings of a language that was loaded before the packs', async () => {
    await i18next.changeLanguage('en');
    expect(i18next.t('glossary|Namespaces')).toBe('Projects');
  });

  it('is overridden by strings that plugins register', async () => {
    addLocale({ code: 'de', resources: { translation: { Delete: 'Löschen (plugin)' } } });
    await i18next.changeLanguage('de');
    expect(i18next.t('Delete')).toBe('Löschen (plugin)');
    expect(i18next.t('Close')).toBe('Zu');
  });

  it('adds plugin strings', async () => {
    expect(getPackPluginLanguages('@scope/plugin')).toEqual(['xy']);
    expect(await getPackPluginStrings('@scope/plugin', 'xy')).toEqual({ Hello: 'Hello (xy)' });
    expect(await getPackPluginStrings('@scope/plugin', 'de')).toEqual({});
  });
});

describe('loadLanguagePacks', () => {
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('adds no packs when the backend has none or the request fails', async () => {
    const before = Object.keys(supportedLanguages);
    for (const response of [
      { ok: true, json: async () => [] },
      { ok: false, json: async () => ({}) },
      { ok: true, json: async () => ({ not: 'a list' }) },
    ]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      await loadLanguagePacks();
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await loadLanguagePacks();
    warn.mockRestore();
    expect(Object.keys(supportedLanguages)).toEqual(before);
  });
});
