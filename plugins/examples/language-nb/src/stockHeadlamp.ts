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

/*
 * Adds a language to a Headlamp release that has no registerLocale, such as
 * 0.46.0. Those releases give a plugin no handle on the i18next instance that
 * translates Headlamp's pages, so this finds it in the React tree, where App
 * passes it to I18nextProvider as the `i18n` prop. That relies on React's
 * internal fields and can stop working with any React or Headlamp upgrade.
 *
 * Compared with registerLocale, the locale selector shows the code instead of
 * the language's name, and Material UI and the tables stay in English, because
 * the maps that hold those live in Headlamp's code.
 */

import { isRequestedFirst, PluginLocale } from './locale';

interface CoreI18n {
  options: { supportedLngs?: false | readonly string[] };
  addResourceBundle(
    lng: string,
    ns: string,
    resources: object,
    deep?: boolean,
    overwrite?: boolean
  ): unknown;
  changeLanguage(lng: string): Promise<unknown>;
  on(event: 'languageChanged', listener: (lng: string) => void): void;
}

interface Fiber {
  memoizedProps?: { i18n?: Partial<CoreI18n> } | null;
  child: Fiber | null;
  sibling: Fiber | null;
}

function findCoreI18n(): CoreI18n | null {
  const container = document.getElementById('root');
  if (!container) {
    return null;
  }
  const key = Object.keys(container).find(k => k.startsWith('__reactContainer$'));
  const rootFiber = key ? (container as unknown as Record<string, Fiber>)[key] : null;

  // The provider sits a few levels below the root, so the walk is short.
  const stack: Fiber[] = rootFiber ? [rootFiber] : [];
  for (let visited = 0; stack.length > 0 && visited < 10000; visited++) {
    const fiber = stack.pop()!;
    const i18n = fiber.memoizedProps?.i18n;
    if (
      typeof i18n?.addResourceBundle === 'function' &&
      typeof i18n.changeLanguage === 'function'
    ) {
      return i18n as CoreI18n;
    }
    if (fiber.sibling) {
      stack.push(fiber.sibling);
    }
    if (fiber.child) {
      stack.push(fiber.child);
    }
  }
  return null;
}

// Headlamp stores the language it resolved, and that is English on a release
// without this language, so the user's choice is kept under a key of its own.
const PREFERENCE_KEY = 'headlamp-language-nb.language';

function readPreference() {
  try {
    return window.localStorage.getItem(PREFERENCE_KEY);
  } catch {
    return null;
  }
}

function writePreference(lng: string) {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, lng);
  } catch {
    // Storage can be blocked.
  }
}

/** Returns false when Headlamp's i18next instance cannot be found. */
export function registerOnStockHeadlamp(locale: PluginLocale): boolean {
  const i18n = findCoreI18n();
  if (!i18n) {
    return false;
  }

  const lngs = i18n.options.supportedLngs;
  const available = Array.isArray(lngs) ? lngs.filter(lng => lng !== 'cimode') : [];
  if (Array.isArray(lngs) && !lngs.includes(locale.code)) {
    // i18next's language utilities hold this same array. 'cimode' stays last.
    const at = lngs.indexOf('cimode');
    (lngs as string[]).splice(at < 0 ? lngs.length : at, 0, locale.code);
  }

  for (const ns of new Set(['translation', 'glossary', 'app', ...Object.keys(locale.resources)])) {
    i18n.addResourceBundle(locale.code, ns, locale.resources[ns] ?? {}, true, true);
  }

  const requested: string[] = [];
  const fromQuery = new URLSearchParams(window.location.search).get('lng');
  if (fromQuery) {
    requested.push(fromQuery);
  }
  const preference = readPreference();
  if (preference) {
    requested.push(preference);
  }
  requested.push(...(navigator.languages ?? [navigator.language]));

  i18n.on('languageChanged', writePreference);
  if (isRequestedFirst(locale.code, requested, available)) {
    i18n.changeLanguage(locale.code);
  }
  return true;
}
