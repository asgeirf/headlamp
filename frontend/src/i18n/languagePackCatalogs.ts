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

import { keepsShape } from './translationShape';

type Strings = Record<string, string>;

/** Time to wait for a catalog before the language is loaded without it. */
export const CATALOG_TIMEOUT_MS = 5000;

/**
 * Fetches JSON and fails after `ms` milliseconds. If a language pack is slow,
 * Headlamp shows English text for a few seconds instead of waiting for it.
 */
export async function fetchJsonWithTimeout(
  url: string,
  headers: HeadersInit,
  ms: number
): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`no response after ${ms} ms`));
    }, ms);
  });
  try {
    return await Promise.race([
      fetch(url, { headers, signal: controller.signal }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      }),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

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

/**
 * Returns the strings of a catalog that can be used: non-empty strings with the
 * same placeholders and tags as their English key. For the other keys, Headlamp
 * shows the string it shows without the pack.
 */
function usableStrings(json: unknown, url: string): Strings {
  const strings: Strings = {};
  const misshapen: string[] = [];
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    for (const [key, value] of Object.entries(json)) {
      // An empty value is an untranslated string.
      if (typeof value !== 'string' || value === '') {
        continue;
      }
      if (keepsShape(key, value)) {
        strings[key] = value;
      } else {
        misshapen.push(key);
      }
    }
  }
  if (misshapen.length > 0) {
    console.warn(
      `Language pack catalog ${url}: skipped ${misshapen.length} translation(s) with placeholders or tags that differ from the English key:`,
      misshapen
    );
  }
  return strings;
}

function fetchStrings(url: string): Promise<Strings> {
  let response = responses.get(url);
  if (!response) {
    response = fetchJsonWithTimeout(url, requestHeaders, CATALOG_TIMEOUT_MS)
      .then(json => usableStrings(json, url))
      .catch(error => {
        console.warn(`Could not read the language pack catalog ${url}:`, error);
        // Request the catalog again the next time the language is loaded.
        responses.delete(url);
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

/** A plugin that is newer than the version a language pack was translated from. */
export interface PluginUpdate {
  name: string;
  translatedFrom: string;
  installed: string;
}

/** The versions a language pack was translated from, as shown in Settings. */
export interface LanguagePackInfo {
  name: string;
  version?: string;
  /** The Headlamp version the pack was translated from. */
  headlamp?: string;
  /** Whether that version is older than the running Headlamp. */
  older?: boolean;
  /** The installed plugins that are newer than the versions the pack was translated from. */
  updatedPlugins?: PluginUpdate[];
}

const packInfo = new Map<string, LanguagePackInfo[]>();
const infoListeners = new Set<() => void>();
let infoVersion = 0;

/** Adds the information about a language pack for its language. */
export function addLanguagePackInfo(code: string, info: LanguagePackInfo) {
  const key = code.toLowerCase();
  packInfo.set(key, [...(packInfo.get(key) ?? []), info]);
  infoVersion++;
  infoListeners.forEach(listener => listener());
}

/** Sets the plugins that are newer than the versions a language pack was translated from. */
export function setUpdatedPlugins(code: string, packName: string, updated: PluginUpdate[]) {
  const key = code.toLowerCase();
  packInfo.set(
    key,
    (packInfo.get(key) ?? []).map(info =>
      info.name === packName ? { ...info, updatedPlugins: updated } : info
    )
  );
  infoVersion++;
  infoListeners.forEach(listener => listener());
}

/** Returns the language packs for a language, in the order they are applied. */
export function getLanguagePackInfo(code: string | undefined): LanguagePackInfo[] {
  return (code && packInfo.get(code.toLowerCase())) || [];
}

/** Calls the listener when pack information changes. Returns the unsubscribe function. */
export function subscribeLanguagePackInfo(listener: () => void) {
  infoListeners.add(listener);
  return () => {
    infoListeners.delete(listener);
  };
}

/** Returns a number that changes when pack information changes, for useSyncExternalStore. */
export function getLanguagePackInfoVersion() {
  return infoVersion;
}
