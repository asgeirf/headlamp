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

import type { Localization } from '@mui/material/locale';
import type { MRT_Localization } from 'material-react-table';

/**
 * A language that a plugin adds to Headlamp, with Headlamp's own strings in it.
 */
export interface PluginLocale {
  /** The language code, as i18next uses it: 'nb', 'pt-BR'. */
  code: string;
  /** The language's name in the language itself, shown in the locale selector. */
  label: string;
  /** Text direction. Defaults to 'ltr'. */
  dir?: 'ltr' | 'rtl';
  /**
   * Headlamp's catalogs in this language, by namespace: `translation`,
   * `glossary` and `app`, each with the same keys as the English catalog in
   * frontend/src/i18n/locales/en/. A missing key shows the English string.
   */
  resources: { [namespace: string]: { [key: string]: string } };
  /** Material UI's strings for this language, such as `nbNO` from `@mui/material/locale`. */
  muiLocale?: Localization;
  /** The table's strings for this language, from `material-react-table/locales/<code>`. */
  tableLocalization?: MRT_Localization;
}

// Kept apart from config.ts so that the theme and table code can read it
// without starting i18next.
const registered = new Map<string, PluginLocale>();
const listeners = new Set<() => void>();
let version = 0;

export function addRegisteredLocale(locale: PluginLocale) {
  registered.set(locale.code, locale);
  version++;
  listeners.forEach(listener => listener());
}

/** The locale a plugin registered for this code, if any. Codes are matched case-insensitively. */
export function getRegisteredLocale(code: string | undefined): PluginLocale | undefined {
  if (!code) {
    return undefined;
  }
  const lower = code.toLowerCase();
  for (const [key, locale] of registered) {
    if (key.toLowerCase() === lower) {
      return locale;
    }
  }
  return undefined;
}

/** Calls the listener whenever a plugin registers a locale. Returns the unsubscribe function. */
export function subscribeRegisteredLocales(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A number that changes whenever a plugin registers a locale, for useSyncExternalStore. */
export function getRegisteredLocalesVersion() {
  return version;
}
