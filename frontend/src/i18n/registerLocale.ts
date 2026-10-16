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

import i18next, { requestedLanguages, supportedLanguages } from './config';
import sharedConfig from './i18nextSharedConfig.mjs';
import { addRegisteredLocale, getRegisteredLocale, PluginLocale } from './localeRegistry';

function sameLanguage(candidate: string, code: string) {
  const c = candidate.toLowerCase();
  const k = code.toLowerCase();
  return c === k || c.split('-')[0] === k;
}

/**
 * Whether the user asked for `code` ahead of every language in `available`.
 * `requested` is ordered best first; a region variant such as nb-NO counts as
 * its language.
 */
export function isRequestedFirst(code: string, requested: string[], available: string[]) {
  for (const candidate of requested) {
    if (sameLanguage(candidate, code)) {
      return true;
    }
    if (available.some(lng => sameLanguage(candidate, lng))) {
      return false;
    }
  }
  return false;
}

function addSupportedLng(code: string) {
  const lngs = i18next.options.supportedLngs;
  if (!Array.isArray(lngs) || lngs.includes(code)) {
    return;
  }
  // i18next's language utilities hold this same array, so adding to it makes
  // the code supported from now on. 'cimode' stays last.
  const at = lngs.indexOf('cimode');
  (lngs as string[]).splice(at < 0 ? lngs.length : at, 0, code);
}

/**
 * Adds a language to Headlamp at runtime. See `registerLocale` in the plugin
 * registry for the plugin-facing documentation.
 */
export function addLocale(locale: PluginLocale) {
  const { code } = locale;
  if (!code || !locale.label || !locale.resources) {
    console.error('registerLocale: a locale needs a code, a label and resources.');
    return;
  }
  if (getRegisteredLocale(code)) {
    console.warn(`registerLocale: a plugin already registered "${code}". Skipping.`);
    return;
  }
  if (supportedLanguages[code]) {
    console.warn(`registerLocale: Headlamp already includes "${code}". Skipping.`);
    return;
  }

  const available = Object.keys(supportedLanguages);
  supportedLanguages[code] = { label: locale.label, dir: locale.dir ?? 'ltr' };
  addSupportedLng(code);

  // Every namespace gets a bundle, empty if the plugin has none, so i18next
  // never asks the bundled backend for a catalog file that does not exist.
  const namespaces = new Set([...sharedConfig.namespaces, ...Object.keys(locale.resources)]);
  for (const ns of namespaces) {
    i18next.addResourceBundle(code, ns, locale.resources[ns] ?? {}, true, true);
  }

  addRegisteredLocale(locale);

  if (isRequestedFirst(code, requestedLanguages, available)) {
    i18next.changeLanguage(code);
  }
}
