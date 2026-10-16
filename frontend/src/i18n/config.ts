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

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import sharedConfig from './i18nextSharedConfig.mjs';
import { getPackStrings } from './languagePackCatalogs';
import { withRegisteredStrings } from './localeRegistry';

const en = {}; // To keep TS happy.

export const supportedLanguages: {
  [langCode: string]: {
    label: string;
    dir: 'ltr' | 'rtl';
  };
} = {
  en: {
    label: 'English',
    dir: 'ltr',
  },
  es: {
    label: 'Español',
    dir: 'ltr',
  },
  fr: {
    label: 'Français',
    dir: 'ltr',
  },
  ru: {
    label: 'Русский',
    dir: 'ltr',
  },
  'pt-PT': {
    label: 'Português (Portugal)',
    dir: 'ltr',
  },
  'pt-BR': {
    label: 'Português (Brasil)',
    dir: 'ltr',
  },
  de: {
    label: 'Deutsch',
    dir: 'ltr',
  },
  it: {
    label: 'Italiano',
    dir: 'ltr',
  },
  'zh-TW': {
    label: '繁體中文',
    dir: 'ltr',
  },
  zh: {
    label: '简体中文',
    dir: 'ltr',
  },
  ko: {
    label: '한국어',
    dir: 'ltr',
  },
  ja: {
    label: '日本語',
    dir: 'ltr',
  },
  hi: {
    label: 'हिन्दी',
    dir: 'ltr',
  },
  bn: {
    label: 'বাংলা',
    dir: 'ltr',
  },
  ta: {
    label: 'தமிழ்',
    dir: 'ltr',
  },
  ar: {
    label: 'العربية',
    dir: 'rtl',
  },
  ur: {
    label: 'اردو',
    dir: 'rtl',
  },
  he: {
    label: 'עברית',
    dir: 'rtl',
  },
  cs: {
    label: 'Čeština',
    dir: 'ltr',
  },
  hu: {
    label: 'Magyar',
    dir: 'ltr',
  },
  id: {
    label: 'Bahasa Indonesia',
    dir: 'ltr',
  },
  nl: {
    label: 'Nederlands',
    dir: 'ltr',
  },
  pl: {
    label: 'Polski',
    dir: 'ltr',
  },
  sv: {
    label: 'Svenska',
    dir: 'ltr',
  },
  tr: {
    label: 'Türkçe',
    dir: 'ltr',
  },
};

export const isRTL = (lang: string) => supportedLanguages[lang]?.dir === 'rtl';

/**
 * The languages the user requested, in order of preference, read before
 * i18next starts: the `lng` query parameter, the language i18next stored on
 * the last visit, and the browser's languages. If i18next does not support the
 * stored language, it replaces it with the fallback language. Languages that
 * plugins register later (see registerLocale) are therefore matched against
 * this list.
 */
export const requestedLanguages: string[] = readRequestedLanguages();

function readRequestedLanguages(): string[] {
  const found: string[] = [];
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('lng');
    if (fromQuery) {
      found.push(fromQuery);
    }
  } catch {
    // window is not defined in this environment.
  }
  try {
    const stored = window.localStorage.getItem('i18nextLng');
    if (stored) {
      found.push(stored);
    }
  } catch {
    // localStorage can be blocked.
  }
  if (typeof navigator !== 'undefined') {
    found.push(...(navigator.languages ?? [navigator.language]));
  }
  return found.filter(Boolean);
}

i18next
  // detect user language https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(initReactI18next)
  // Use dynamic imports (webpack code splitting) to load javascript bundles.
  // @see https://www.i18next.com/misc/creating-own-plugins#backend
  // @see https://webpack.js.org/guides/code-splitting/
  .use({
    type: 'backend',
    read<Namespace extends keyof typeof en>(
      language: string | any,
      namespace: Namespace,
      callback: (errorValue: unknown, translations: null | (typeof en)[Namespace]) => void
    ) {
      // Headlamp's catalog, overridden by the language packs' strings, which
      // are overridden by the strings that plugins register with registerLocale.
      const packStrings = getPackStrings(language, namespace);
      import(`./locales/${language.toLowerCase()}/${namespace}.json?import=default`)
        .then(
          resources => resources.default,
          error => {
            // A language that only a pack provides has no Headlamp catalog.
            if (!packStrings) {
              throw error;
            }
            return {};
          }
        )
        .then(async catalog => {
          const strings = { ...catalog, ...(await packStrings) };
          callback(null, withRegisteredStrings(language, namespace, strings));
        })
        .catch(error => {
          callback(error, null);
        });
    },
  })
  // i18next options: https://www.i18next.com/overview/configuration-options
  .init({
    debug: import.meta.env.DEV && !import.meta.env.UNDER_TEST,
    ns: sharedConfig.namespaces,
    defaultNS: sharedConfig.defaultNamespace,
    // Keeps the previously stored region-less "pt" preference on Portuguese.
    fallbackLng: { pt: ['pt-PT', 'en'], default: ['en'] },
    contextSeparator: sharedConfig.contextSeparator,
    supportedLngs: Object.keys(supportedLanguages),
    // nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      format: function (value, format, lng) {
        // https://www.i18next.com/translation-function/formatting
        if (format === 'number') return new Intl.NumberFormat(lng).format(value);
        if (format === 'date') return new Intl.DateTimeFormat(lng).format(value);
        return value;
      },
    },
    returnEmptyString: false,
    // https://react.i18next.com/latest/i18next-instance
    // https://www.i18next.com/overview/configuration-options
    react: {
      useSuspense: false, // not needed as we cannot use suspend due to issues with Storybook
    },
    nsSeparator: '|',
    keySeparator: false,
  });

export default i18next;
