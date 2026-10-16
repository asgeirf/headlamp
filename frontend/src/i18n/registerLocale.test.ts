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
    [['nb'], true],
    [['nb-NO', 'en-US'], true],
    [['NB-no'], true],
    [['en-US', 'nb'], false],
    [['de', 'nb'], false],
    [['fi', 'nb'], true],
    [['fi'], false],
    [[], false],
  ])('%j puts nb first: %s', (requested, expected) => {
    expect(isRequestedFirst('nb', requested, available)).toBe(expected);
  });
});

describe('addLocale', () => {
  const tableLocalization = { rowsPerPage: 'Rader per side' } as any;
  const muiLocale = { components: {} } as any;

  beforeAll(() => {
    addLocale({
      code: 'xx',
      label: 'Test language',
      resources: {
        translation: { Close: 'Lukk xx' },
        glossary: { Pods: 'Podder xx' },
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
    expect(i18next.t('Close')).toBe('Lukk xx');
    expect(i18next.t('glossary|Pods')).toBe('Podder xx');
    // A key the catalog lacks shows the English string.
    expect(i18next.t('Cancel')).toBe('Cancel');
    // A namespace the plugin did not supply is present and empty.
    expect(i18next.hasResourceBundle('xx', 'app')).toBe(true);
  });

  it('localizes the table', () => {
    expect(getTableLocalization('xx')).toBe(tableLocalization);
  });

  it('refuses a language Headlamp already includes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const before = getRegisteredLocalesVersion();
    addLocale({ code: 'de', label: 'Deutsch (plugin)', resources: { translation: {} } });
    expect(supportedLanguages.de.label).toBe('Deutsch');
    expect(getRegisteredLocalesVersion()).toBe(before);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('refuses a second registration of the same language', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    addLocale({ code: 'xx', label: 'Other', resources: { translation: {} } });
    expect(supportedLanguages.xx.label).toBe('Test language');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
