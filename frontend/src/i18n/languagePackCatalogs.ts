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

// Stores the language pack catalogs by language. This module is separate from
// config.ts, which reads the catalogs when i18next loads a language, and from
// languagePacks.ts, which adds them.

type Strings = Record<string, string>;

/** The URLs of Headlamp's catalogs (by namespace) and plugin catalogs (by plugin name) for one language. */
interface LanguageCatalogs {
  code: string;
  headlamp: Map<string, string[]>;
  plugins: Map<string, string[]>;
}

const catalogs = new Map<string, LanguageCatalogs>();
const responses = new Map<string, Promise<Strings>>();
let requestHeaders: HeadersInit = {};

function forLanguage(code: string) {
  const key = code.toLowerCase();
  let entry = catalogs.get(key);
  if (!entry) {
    entry = { code, headlamp: new Map(), plugins: new Map() };
    catalogs.set(key, entry);
  }
  return entry;
}

function add(map: Map<string, string[]>, name: string, url: string) {
  map.set(name, [...(map.get(name) ?? []), url]);
}

/** Sets the headers to send with every catalog request, such as the Backstage token. */
export function setLanguagePackHeaders(headers: HeadersInit) {
  requestHeaders = headers;
}

/** Adds a language pack catalog of Headlamp's strings in one namespace. */
export function addHeadlampCatalog(code: string, namespace: string, url: string) {
  add(forLanguage(code).headlamp, namespace, url);
}

/** Adds a language pack catalog of one plugin's strings. */
export function addPluginCatalog(code: string, pluginName: string, url: string) {
  add(forLanguage(code).plugins, pluginName, url);
}

/** Adds a language that a language pack provides, even if the pack has no catalogs. */
export function addPackLanguage(code: string) {
  forLanguage(code);
}

function fetchStrings(url: string): Promise<Strings> {
  let response = responses.get(url);
  if (!response) {
    response = fetch(url, { headers: requestHeaders })
      .then(res => (res.ok ? res.json() : {}))
      .then((json: unknown) => {
        const strings: Strings = {};
        if (json && typeof json === 'object' && !Array.isArray(json)) {
          for (const [key, value] of Object.entries(json)) {
            // An empty value is an untranslated string.
            if (typeof value === 'string' && value !== '') {
              strings[key] = value;
            }
          }
        }
        return strings;
      })
      .catch(error => {
        console.warn(`Could not read the language pack catalog ${url}:`, error);
        return {};
      });
    responses.set(url, response);
  }
  return response;
}

async function merged(urls: string[] | undefined): Promise<Strings> {
  const all = await Promise.all((urls ?? []).map(fetchStrings));
  return Object.assign({}, ...all);
}

/**
 * Returns Headlamp's strings in a namespace from the language packs for a
 * language. Strings in later packs override strings in earlier packs. Returns
 * undefined if no pack provides the language.
 */
export function getPackStrings(code: string, namespace: string): Promise<Strings> | undefined {
  const entry = catalogs.get(code.toLowerCase());
  return entry ? merged(entry.headlamp.get(namespace)) : undefined;
}

/** Returns the languages that the language packs provide for a plugin. */
export function getPackPluginLanguages(pluginName: string): string[] {
  return [...catalogs.values()]
    .filter(entry => entry.plugins.has(pluginName))
    .map(entry => entry.code);
}

/** Returns a plugin's strings from the language packs for a language, or an empty object. */
export function getPackPluginStrings(pluginName: string, code: string): Promise<Strings> {
  return merged(catalogs.get(code.toLowerCase())?.plugins.get(pluginName));
}
