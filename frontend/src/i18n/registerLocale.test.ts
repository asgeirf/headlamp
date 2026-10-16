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

import { getTableLocalization } from '../components/common/Table/tableLocalization';
import i18next, { supportedLanguages } from './config';
import { getRegisteredLocale, getRegisteredLocalesVersion } from './localeRegistry';
import { addLocale, isRequestedFirst } from './registerLocale';

describe('isRequestedFirst', () => {
  const available = ['en', 'de', 'pt-BR'];

  it.each([
    [['fi'], true],
    [['fi-FI', 'en-US'], true],
    [['FI-fi'], true],
    [['en-US', 'fi'], false],
    [['de', 'fi'], false],
    [['et', 'fi'], true],
    [['et'], false],
    [[], false],
  ])('%j puts fi first: %s', (requested, expected) => {
    expect(isRequestedFirst('fi', requested, available)).toBe(expected);
  });
});

describe('addLocale', () => {
  const tableLocalization = { rowsPerPage: 'Rows per page (xx)' } as any;
  const muiLocale = { components: {} } as any;

  beforeAll(() => {
    addLocale({
      code: 'xx',
      label: 'Test language',
      resources: {
        translation: { Close: 'Close (xx)' },
        glossary: { Pods: 'Pods (xx)' },
      },
      muiLocale,
      tableLocalization,
    });
  });

  afterAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('makes the language selectable', () => {
    expect(supportedLanguages.xx).toEqual({ label: 'Test language', dir: 'ltr' });
    const lngs = i18next.options.supportedLngs as string[];
    expect(lngs).toContain('xx');
    expect(lngs[lngs.length - 1]).toBe('cimode');
    expect(getRegisteredLocale('XX')?.label).toBe('Test language');
  });

  it("serves Headlamp's strings from the plugin's catalogs", async () => {
    await i18next.changeLanguage('xx');
    expect(i18next.resolvedLanguage).toBe('xx');
    expect(i18next.t('Close')).toBe('Close (xx)');
    expect(i18next.t('glossary|Pods')).toBe('Pods (xx)');
    // A key the catalog lacks shows the English string.
    expect(i18next.t('Cancel')).toBe('Cancel');
    // A namespace the plugin did not supply is present and empty.
    expect(i18next.hasResourceBundle('xx', 'app')).toBe(true);
  });

  it('localizes the table', () => {
    expect(getTableLocalization('xx')).toBe(tableLocalization);
  });

  it('merges a second registration of the language over the first', async () => {
    addLocale({
      code: 'XX',
      label: 'Other',
      resources: { translation: { Close: 'Close (xx2)', Delete: 'Delete (xx)' } },
    });
    await i18next.changeLanguage('xx');
    expect(i18next.t('Close')).toBe('Close (xx2)');
    expect(i18next.t('Delete')).toBe('Delete (xx)');
    expect(i18next.t('glossary|Pods')).toBe('Pods (xx)');
    expect(supportedLanguages.xx.label).toBe('Test language');
    expect(supportedLanguages).not.toHaveProperty('XX');
  });

  it('refuses a new language without a label', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = getRegisteredLocalesVersion();
    addLocale({ code: 'yy', resources: { translation: {} } });
    expect(supportedLanguages).not.toHaveProperty('yy');
    expect(getRegisteredLocalesVersion()).toBe(before);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('addLocale for a language Headlamp includes', () => {
  afterAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('changes strings of a language that has not loaded yet', async () => {
    expect(i18next.hasResourceBundle('de', 'translation')).toBe(false);
    addLocale({
      code: 'de',
      label: 'Deutsch (plugin)',
      resources: { translation: { Close: 'Zu' } },
    });
    await i18next.changeLanguage('de');
    expect(i18next.t('Close')).toBe('Zu');
    // Keys the plugin did not list keep Headlamp's translation.
    expect(i18next.t('Cancel')).toBe('Abbrechen');
    expect(supportedLanguages.de.label).toBe('Deutsch');
    expect((i18next.options.supportedLngs as string[]).filter(lng => lng === 'de')).toHaveLength(1);
  });

  it('changes strings of a language that has loaded', () => {
    addLocale({ code: 'de', resources: { translation: { Settings: 'Optionen' } } });
    expect(i18next.t('Settings')).toBe('Optionen');
    expect(i18next.t('Close')).toBe('Zu');
  });

  it('changes English strings, which other languages fall back to', async () => {
    await i18next.changeLanguage('en');
    addLocale({ code: 'en', resources: { glossary: { Namespaces: 'Projects' } } });
    expect(i18next.t('glossary|Namespaces')).toBe('Projects');
    await i18next.changeLanguage('xx');
    expect(i18next.t('glossary|Namespaces')).toBe('Projects');
  });

  it("matches Headlamp's code whatever the case", () => {
    const tableLocalization = { rowsPerPage: 'Rows per page (zh-TW)' } as any;
    addLocale({ code: 'zh-tw', tableLocalization });
    expect(supportedLanguages).not.toHaveProperty('zh-tw');
    expect(getRegisteredLocale('zh-TW')?.code).toBe('zh-TW');
    expect(getTableLocalization('zh-TW')).toBe(tableLocalization);
    // Languages no plugin changed keep Headlamp's table strings.
    expect(getTableLocalization('ja')?.rowsPerPage).toBeTruthy();
    expect(getTableLocalization('ja')).not.toBe(tableLocalization);
  });
});
