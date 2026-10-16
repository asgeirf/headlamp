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

import type { i18n } from 'i18next';

type Strings = Record<string, string>;

const NAMESPACE = 'app';
const LANGUAGE_CODE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;

// Headlamp's own `app` catalog for each language whose strings a plugin
// changed, so that a later message replaces the plugins' strings instead of
// adding to them.
const headlampStrings = new WeakMap<i18n, Map<string, Strings>>();

function isStrings(value: unknown): value is Strings {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every(text => typeof text === 'string')
  );
}

function addSupportedLng(i18n: i18n, lng: string) {
  const lngs = i18n.options.supportedLngs;
  if (!Array.isArray(lngs) || lngs.includes(lng)) {
    return;
  }
  // i18next's language utilities hold this same array. 'cimode' stays last.
  const at = lngs.indexOf('cimode');
  (lngs as string[]).splice(at < 0 ? lngs.length : at, 0, lng);
}

/**
 * Applies the desktop strings that plugins registered in the renderer with
 * registerLocale. Each language's catalog becomes Headlamp's own with the
 * plugins' strings over it. A message holds all of the plugins' strings for
 * the languages it names, so strings from a plugin that is no longer loaded
 * are removed. A language Headlamp does not include is added.
 *
 * @param i18n - The main process's i18next instance.
 * @param locales - The plugins' strings by language code, from the renderer.
 * @returns Whether a language in use, or its fallback, changed.
 */
export async function applyPluginStrings(i18n: i18n, locales: unknown): Promise<boolean> {
  if (!locales || typeof locales !== 'object' || Array.isArray(locales)) {
    return false;
  }
  let saved = headlampStrings.get(i18n);
  if (!saved) {
    saved = new Map();
    headlampStrings.set(i18n, saved);
  }

  const updates: [string, Strings, boolean][] = [];
  for (const [code, strings] of Object.entries(locales)) {
    const lng = code.toLowerCase();
    if (!LANGUAGE_CODE.test(lng) || !isStrings(strings)) {
      continue;
    }
    if (!saved.has(lng) && Object.keys(strings).length === 0) {
      continue;
    }
    const onDisk = (i18n.options.supportedLngs || []).includes(lng);
    // Added before any await, so that the language change the renderer sends
    // next finds the language supported.
    addSupportedLng(i18n, lng);
    updates.push([lng, strings, onDisk]);
  }

  let inUse = false;
  for (const [lng, strings, onDisk] of updates) {
    if (!saved.has(lng)) {
      if (onDisk) {
        await i18n.loadLanguages(lng);
      }
      saved.set(lng, { ...i18n.getResourceBundle(lng, NAMESPACE) });
    }
    i18n.removeResourceBundle(lng, NAMESPACE);
    i18n.addResourceBundle(lng, NAMESPACE, { ...saved.get(lng), ...strings });
    inUse ||= !!i18n.languages?.includes(lng);
  }
  return inUse;
}
