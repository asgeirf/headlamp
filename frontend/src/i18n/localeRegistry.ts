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
 * A plugin's strings for a language. The language is either new, or one that
 * Headlamp includes and the plugin changes.
 */
export interface PluginLocale {
  /** The language code, for example 'fi' or 'pt-BR'. */
  code: string;
  /**
   * The name of the language, written in that language. It is shown in the
   * locale selector. Required for a language that Headlamp does not include,
   * and ignored for other languages.
   */
  label?: string;
  /** The text direction of a language that Headlamp does not include. Defaults to 'ltr'. */
  dir?: 'ltr' | 'rtl';
  /**
   * Headlamp's strings in this language, by namespace (`translation`,
   * `glossary` and `app`), with the keys of the English catalogs in
   * frontend/src/i18n/locales/en/. Required for a language that Headlamp does
   * not include. Missing keys are shown in English. For a language that
   * Headlamp includes, these strings replace Headlamp's strings for the same
   * keys.
   */
  resources?: { [namespace: string]: { [key: string]: string } };
  /** The Material UI strings for this language, for example `fiFI` from `@mui/material/locale`. */
  muiLocale?: Localization;
  /** The table strings for this language, from `material-react-table/locales/<code>`. */
  tableLocalization?: MRT_Localization;
}

// This module is separate from config.ts, so that the theme and table code can
// read it without starting i18next. The map is keyed by the lower-case language
// code. Each entry merges all registrations for the language, and later
// registrations override earlier ones.
const registered = new Map<string, PluginLocale>();
const listeners = new Set<() => void>();
let version = 0;

function merge(base: PluginLocale, next: PluginLocale): PluginLocale {
  const resources = { ...base.resources };
  for (const [namespace, strings] of Object.entries(next.resources ?? {})) {
    resources[namespace] = { ...resources[namespace], ...strings };
  }
  return {
    ...base,
    resources,
    muiLocale: next.muiLocale ?? base.muiLocale,
    tableLocalization: next.tableLocalization ?? base.tableLocalization,
  };
}

export function addRegisteredLocale(locale: PluginLocale) {
  const key = locale.code.toLowerCase();
  const previous = registered.get(key);
  registered.set(key, previous ? merge(previous, locale) : locale);
  version++;
  listeners.forEach(listener => listener());
}

/** Returns what plugins registered for a language code. The code is not case-sensitive. */
export function getRegisteredLocale(code: string | undefined): PluginLocale | undefined {
  return code ? registered.get(code.toLowerCase()) : undefined;
}

/** Returns a catalog with the strings that plugins registered for its language and namespace applied. */
export function withRegisteredStrings<T extends object>(
  code: string,
  namespace: string,
  catalog: T
): T {
  const strings = getRegisteredLocale(code)?.resources?.[namespace];
  return strings ? { ...catalog, ...strings } : catalog;
}

/** Calls the listener when a plugin registers a locale. Returns the unsubscribe function. */
export function subscribeRegisteredLocales(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Returns a number that changes when a plugin registers a locale, for useSyncExternalStore. */
export function getRegisteredLocalesVersion() {
  return version;
}
