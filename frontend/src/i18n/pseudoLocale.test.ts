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

import { afterAll, describe, expect, it } from 'vitest';
import { getTableLocalization } from '../components/common/Table/tableLocalization';
import i18next, { supportedLanguages } from './config';
import { addPseudoLanguage } from './languagePacks';
import { PSEUDO_LANGUAGE, pseudoLocalize, pseudoLocalizeAll } from './pseudoLocale';

describe('pseudoLocalize', () => {
  it('replaces letters with accented letters and adds brackets', () => {
    expect(pseudoLocalize('Settings')).toBe('[Šéţţîñĝš]');
    expect(pseudoLocalize('CPU: 2')).toBe('[ÇÞÛ: 2]');
  });

  it('does not change markup, placeholders or inserted values', () => {
    expect(pseudoLocalize('Delete {{ name }}?')).toBe('[Ðéļéţé {{ name }}?]');
    expect(pseudoLocalize('Read <1>the docs</1>')).toBe('[Ŕéáð <1>ţĥé ðöçš</1>]');
    expect(pseudoLocalize('Delete web-1?', ['web-1'])).toBe('[Ðéļéţé web-1?]');
    expect(pseudoLocalize('$t(glossary|Pods) found')).toBe('[$t(glossary|Pods) ƒöûñð]');
    expect(pseudoLocalize('Sort by {column}')).toBe('[Šöŕţ ƀý {column}]');
  });

  it('transforms every string in a locale object, and the return values of its functions', () => {
    const locale = {
      title: 'Rows',
      nested: { label: 'Close' },
      count: 3,
      rows: (n: number) => `${n} rows`,
    };
    const marked = pseudoLocalizeAll(locale);
    expect(marked.title).toBe('[Ŕöŵš]');
    expect(marked.nested.label).toBe('[Çļöšé]');
    expect(marked.count).toBe(3);
    expect(marked.rows(2)).toBe('[2 ŕöŵš]');
    expect(pseudoLocalizeAll(locale)).toBe(marked);
  });
});

describe('the pseudo-language', () => {
  afterAll(async () => {
    await i18next.changeLanguage('en');
  });

  it("transforms Headlamp's strings, including missing keys, only in the pseudo-language", async () => {
    addPseudoLanguage();
    expect(supportedLanguages[PSEUDO_LANGUAGE]?.label).toBe('Pseudo-language (en-XA)');

    await i18next.changeLanguage(PSEUDO_LANGUAGE);
    expect(i18next.t('Close')).toBe('[Çļöšé]');
    expect(i18next.t('glossary|Pods')).toBe('[Þöðš]');
    expect(i18next.t('Not in any catalog {{name}}', { name: 'web-1' })).toBe(
      '[Ñöţ îñ áñý çáţáļöĝ web-1]'
    );
    // The table strings, which a pack translates with tableLocale.
    expect(getTableLocalization('en')?.rowsPerPage).toBe('[Ŕöŵš þéŕ þáĝé]');

    await i18next.changeLanguage('en');
    expect(i18next.t('Close')).toBe('Close');
    expect(getTableLocalization('en')?.rowsPerPage).toBe('Rows per page');
  });
});
