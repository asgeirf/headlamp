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
 * Whether the user asked for `code` ahead of every language in `available`.
 * `requested` is ordered best first; a region variant such as fi-FI counts as
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

function findCode(codes: string[], code: string) {
  const lower = code.toLowerCase();
  return codes.find(candidate => candidate.toLowerCase() === lower);
}

/**
 * Adds a language to Headlamp at runtime, or changes Headlamp's strings in a
 * language it already has. See `registerLocale` in the plugin registry for the
 * plugin-facing documentation.
 */
export function addLocale(locale: PluginLocale) {
  if (!locale.code) {
    console.error('registerLocale: a locale needs a code.');
    return;
  }

  const available = Object.keys(supportedLanguages);
  const known = findCode(available, locale.code);
  const isNew = !known;
  if (isNew && (!locale.label || !locale.resources)) {
    console.error(
      `registerLocale: Headlamp does not include "${locale.code}", so the locale needs a label and resources.`
    );
    return;
  }
  // Headlamp's spelling of the code, so that 'zh-tw' changes zh-TW.
  const code = known ?? locale.code;

  if (isNew) {
    supportedLanguages[code] = { label: locale.label!, dir: locale.dir ?? 'ltr' };
    addSupportedLng(code);
    // Every namespace gets a bundle, empty if the plugin has none, so i18next
    // never asks the bundled backend for a catalog file that does not exist.
    const namespaces = new Set([...sharedConfig.namespaces, ...Object.keys(locale.resources!)]);
    for (const ns of namespaces) {
      i18next.addResourceBundle(code, ns, {}, true, true);
    }
  }

  // The label and direction of a language Headlamp includes stay Headlamp's.
  addRegisteredLocale(
    isNew ? { ...locale, code } : { ...locale, code, label: undefined, dir: undefined }
  );

  // A catalog i18next has not loaded yet gets the strings when it loads, in
  // the backend in config.ts. Adding a bundle before then would stop it loading.
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
    // Headlamp re-renders its text when the language changes, not when a
    // catalog does, so the language in use (or its fallback) is set again.
    i18next.changeLanguage(i18next.language);
  }
}
