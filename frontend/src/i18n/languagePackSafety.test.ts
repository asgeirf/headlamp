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

import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { supportedLanguages } from './config';
import { CATALOG_TIMEOUT_MS, getLanguagePackInfo, getPackStrings } from './languagePackCatalogs';
import {
  addLanguagePacks,
  announcePluginTargets,
  LIST_TIMEOUT_MS,
  loadLanguagePacks,
} from './languagePacks';

vi.mock('../helpers/getProductInfo', () => ({
  getVersion: () => ({ VERSION: '0.46.0', GIT_VERSION: '' }),
}));

const never = () => new Promise(() => {});

describe('language pack safety', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    warn.mockRestore();
  });

  it('starts without packs when the list request times out', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(never));
    const before = Object.keys(supportedLanguages);

    const loading = loadLanguagePacks();
    await vi.advanceTimersByTimeAsync(LIST_TIMEOUT_MS);
    await loading;

    expect(Object.keys(supportedLanguages)).toEqual(before);
    expect(warn).toHaveBeenCalled();
  });

  it('loads a language without a catalog when the catalog request times out', async () => {
    vi.stubGlobal('fetch', vi.fn(never));
    await addLanguagePacks([
      {
        name: 'slow',
        manifest: { language: { code: 'xs', label: 'Slow' } },
        files: ['headlamp/translation.json'],
      },
    ]);

    vi.useFakeTimers();
    const strings = getPackStrings('xs', 'translation')!;
    await vi.advanceTimersByTimeAsync(CATALOG_TIMEOUT_MS);
    expect(await strings).toEqual({});
  });

  it('skips translations with different placeholders or tags', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          Close: 'Lukk',
          'Delete {{name}}?': 'Slette {{navn}}?',
          'Read <1>the docs</1>': 'Les dokumentasjonen',
          '{{count}} pods_one': 'Én pod',
        }),
      }))
    );
    await addLanguagePacks([
      {
        name: 'shape',
        manifest: { language: { code: 'xt', label: 'Shape' } },
        files: ['headlamp/translation.json'],
      },
    ]);

    expect(await getPackStrings('xt', 'translation')).toEqual({
      Close: 'Lukk',
      '{{count}} pods_one': 'Én pod',
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('2 translation(s)'), [
      'Delete {{name}}?',
      'Read <1>the docs</1>',
    ]);
  });

  it("adds the pack's version to its catalog URLs", async () => {
    const fetchSpy = vi.fn(async (url: string) => ({ ok: !!url, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchSpy);
    await addLanguagePacks([
      {
        name: 'versioned',
        manifest: { version: '2026.10.1', language: { code: 'xv', label: 'Versioned' } },
        files: ['headlamp/glossary.json'],
      },
    ]);
    await getPackStrings('xv', 'glossary');

    expect(String(fetchSpy.mock.calls[0][0])).toMatch(
      /language-packs\/versioned\/headlamp\/glossary\.json\?v=2026\.10\.1$/
    );
  });

  it('warns when a pack for a language Headlamp includes is older than Headlamp', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({}) }))
    );
    await addLanguagePacks([
      {
        name: 'old-de',
        manifest: { language: { code: 'de' }, translatedFrom: { headlamp: '0.40.0' } },
        files: ['headlamp/translation.json'],
      },
      {
        name: 'current-fr',
        manifest: { language: { code: 'fr' }, translatedFrom: { headlamp: '0.46.0' } },
        files: ['headlamp/translation.json'],
      },
    ]);

    const messages = warn.mock.calls.map(call => String(call[0]));
    expect(messages.filter(message => message.includes('old-de'))).toHaveLength(1);
    expect(messages.some(message => message.includes('current-fr'))).toBe(false);
  });

  it('records the version each pack was translated from, and logs when it is older', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({}) }))
    );
    await addLanguagePacks([
      {
        name: 'old-xo',
        manifest: {
          version: '1',
          language: { code: 'xo', label: 'Old' },
          translatedFrom: { headlamp: '0.45.0', plugins: { '@scope/flux': '0.6.0' } },
        },
        files: ['headlamp/translation.json'],
      },
      { name: 'untagged-xu', manifest: { language: { code: 'xu', label: 'Untagged' } }, files: [] },
    ]);

    expect(getLanguagePackInfo('xo')).toEqual([
      { name: 'old-xo', version: '1', headlamp: '0.45.0', older: true },
    ]);
    expect(getLanguagePackInfo('XU')).toEqual([
      { name: 'untagged-xu', version: undefined, headlamp: undefined, older: false },
    ]);
    const notes = info.mock.calls.map(call => String(call[0]));
    expect(
      notes.some(note => note.includes('"old-xo"') && note.includes('are shown in English'))
    ).toBe(true);
    expect(
      notes.some(note => note.includes('"untagged-xu": translatedFrom.headlamp is not set'))
    ).toBe(true);

    announcePluginTargets([
      { name: '@scope/flux', version: '0.7.0' },
      { name: '@scope/other', version: '9.0.0' },
    ]);
    expect(getLanguagePackInfo('xo')[0].updatedPlugins).toEqual([
      { name: '@scope/flux', translatedFrom: '0.6.0', installed: '0.7.0' },
    ]);
    info.mockRestore();
  });

  it('ignores values in pack.json that are not text', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({}) }))
    );
    await addLanguagePacks([
      {
        name: 'odd-xq',
        manifest: {
          version: 7,
          language: { code: 'xq', label: 'Odd' },
          translatedFrom: { headlamp: 46, plugins: { '@scope/a': 1, '@scope/b': null } },
        } as any,
        files: [],
      },
    ]);
    expect(getLanguagePackInfo('xq')).toEqual([
      { name: 'odd-xq', version: undefined, headlamp: undefined, older: false },
    ]);
    expect(() => announcePluginTargets([{ name: '@scope/a', version: '2.0.0' }])).not.toThrow();
    expect(getLanguagePackInfo('xq')[0].updatedPlugins).toBeUndefined();
    info.mockRestore();
  });
});
