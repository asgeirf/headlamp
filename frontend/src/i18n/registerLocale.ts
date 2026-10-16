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
import { addRegisteredLocale, PluginLocale } from './localeRegistry';

function sameLanguage(candidate: string, code: string) {
  const c = candidate.toLowerCase();
  const k = code.toLowerCase();
  return c === k || c.split('-')[0] === k;
}

/**
 * Returns whether the user requested `code` before all languages in
 * `available`. `requested` is in order of preference. A regional variant, such
 * as fi-FI, matches its language.
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
  // i18next's language utilities use this same array, so adding the code here
  // makes it supported. Keep 'cimode' last.
  const at = lngs.indexOf('cimode');
  (lngs as string[]).splice(at < 0 ? lngs.length : at, 0, code);
}

/** Returns the code in `codes` that matches `code`, ignoring case. */
export function findCode(codes: string[], code: string) {
  const lower = code.toLowerCase();
  return codes.find(candidate => candidate.toLowerCase() === lower);
}

/**
 * Makes a language that Headlamp does not include selectable. i18next loads
 * the language's catalogs when they are needed, so the caller must provide
 * them.
 */
export function addLanguage(code: string, label: string, dir: 'ltr' | 'rtl' = 'ltr') {
  supportedLanguages[code] = { label, dir };
  addSupportedLng(code);
}

/**
 * Adds a language to Headlamp at runtime, or changes Headlamp's strings in a
 * language that Headlamp includes. For the plugin documentation, see
 * `registerLocale` in the plugin registry.
 */
export function addLocale(locale: PluginLocale) {
  if (!locale.code) {
    console.error('registerLocale: code is required.');
    return;
  }

  const available = Object.keys(supportedLanguages);
  const known = findCode(available, locale.code);
  const isNew = !known;
  if (isNew && (!locale.label || !locale.resources)) {
    console.error(
      `registerLocale: label and resources are required for "${locale.code}", which Headlamp does not include.`
    );
    return;
  }
  // Use Headlamp's spelling of the code, so that 'zh-tw' changes zh-TW.
  const code = known ?? locale.code;

  if (isNew) {
    addLanguage(code, locale.label!, locale.dir);
    // Add a bundle for every namespace, empty if the plugin has none, so that
    // i18next does not request a catalog file that does not exist.
    const namespaces = new Set([...sharedConfig.namespaces, ...Object.keys(locale.resources!)]);
    for (const ns of namespaces) {
      i18next.addResourceBundle(code, ns, {}, true, true);
    }
  }

  // For a language that Headlamp includes, keep Headlamp's label and direction.
  addRegisteredLocale(
    isNew ? { ...locale, code } : { ...locale, code, label: undefined, dir: undefined }
  );

  // The backend in config.ts adds the strings to catalogs that are not loaded
  // yet. Adding a bundle before the catalog is loaded would prevent loading it.
  for (const [ns, strings] of Object.entries(locale.resources ?? {})) {
    if (i18next.hasResourceBundle(code, ns)) {
      i18next.addResourceBundle(code, ns, strings, true, true);
    }
  }

  if (isNew) {
    if (isRequestedFirst(code, requestedLanguages, available)) {
      i18next.changeLanguage(code);
    }
  } else if (i18next.languages?.some(lng => lng.toLowerCase() === code.toLowerCase())) {
    // Headlamp re-renders text when the language changes, but not when a
    // catalog changes, so set the current language again.
    i18next.changeLanguage(i18next.language);
  }
}
