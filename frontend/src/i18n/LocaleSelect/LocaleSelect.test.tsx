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

import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18next from '../config';
import { addLanguagePackInfo, setUpdatedPlugins } from '../languagePackCatalogs';
import LocaleSelect from './LocaleSelect';

describe('LocaleSelect', () => {
  it('lists the language packs for the selected language with the versions they were translated from', async () => {
    await i18next.changeLanguage('en');
    render(<LocaleSelect showFullNames showLanguagePacks />);
    expect(screen.queryByText(/Language pack/)).not.toBeInTheDocument();

    act(() => {
      addLanguagePackInfo('en', {
        name: 'acme-terms',
        version: '3',
        headlamp: '0.45.0',
        older: true,
      });
      setUpdatedPlugins('en', 'acme-terms', [
        { name: '@headlamp-k8s/flux', translatedFrom: '0.6.0', installed: '0.7.0' },
      ]);
    });

    const text = screen.getByText(/Language pack acme-terms 3, for Headlamp 0.45.0/).textContent;
    expect(text).toContain('Made for an earlier Headlamp');
    expect(text).toContain('Made for @headlamp-k8s/flux 0.6.0, and 0.7.0 is installed');
  });

  it('truncates long pack names without splitting a character', async () => {
    await i18next.changeLanguage('en');
    render(<LocaleSelect showFullNames showLanguagePacks />);
    act(() => {
      addLanguagePackInfo('en', { name: `${'x'.repeat(78)}${'😀'.repeat(5)}`, headlamp: '0.46.0' });
    });
    expect(
      screen
        .getByText(/, for Headlamp 0.46.0/)
        .textContent?.startsWith(`Language pack ${'x'.repeat(78)}😀…, for Headlamp`)
    ).toBe(true);
  });

  it('does not list language packs when showLanguagePacks is not set', () => {
    render(<LocaleSelect />);
    expect(screen.queryByText(/Language pack/)).not.toBeInTheDocument();
  });
});
