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
import semver from 'semver';
import { getAppUrl } from '../helpers/getAppUrl';
import { getVersion } from '../helpers/getProductInfo';
import { isDevMode } from '../helpers/isDevMode';
import i18next, { requestedLanguages, supportedLanguages } from './config';
import sharedConfig from './i18nextSharedConfig.mjs';
import {
  addHeadlampCatalog,
  addPackLanguage,
  addPluginCatalog,
  fetchJsonWithTimeout,
  setLanguagePackHeaders,
} from './languagePackCatalogs';
import { addRegisteredLocale, getRegisteredLocale } from './localeRegistry';
import { PSEUDO_LANGUAGE } from './pseudoLocale';
import { addLanguage, addLocale, findCode, isRequestedFirst } from './registerLocale';

/** A language pack's pack.json. */
export interface LanguagePackManifest {
  name?: string;
  version?: string;
  language: {
    /** The language code, for example 'nb' or 'pt-BR'. */
    code: string;
    /** The name of the language, written in that language. Required for a language that Headlamp does not include. */
    label?: string;
    dir?: 'ltr' | 'rtl';
  };
  /** The name of the Material UI locale for the language, for example 'nbNO'. */
  muiLocale?: string;
  /** The name of the table locale, a directory in material-react-table/locales, for example 'no'. */
  tableLocale?: string;
  /** The versions the pack was translated from: the Headlamp version, and each plugin's version by package name. */
  translatedFrom?: { headlamp?: string; plugins?: Record<string, string> };
}

/** Time to wait for the list of packs before Headlamp starts without them. */
export const LIST_TIMEOUT_MS = 3000;

/** A language pack, as listed by the backend. */
export interface LanguagePack {
  name: string;
  manifest: LanguagePackManifest;
  /** The pack's catalog files, relative to the pack directory. */
  files: string[];
}

const LANGUAGE_CODE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;
const HEADLAMP_CATALOG = /^headlamp\/([^/]+)\.json$/;
const PLUGIN_CATALOG = /^plugins\/(.+)\/translation\.json$/;

// The names of the Material UI and table locales in the packs, by language. The
// locales are loaded the first time the language is used.
const uiLocaleNames = new Map<string, { code: string; mui?: string; table?: string }>();

let listening = false;

const TABLE_LOCALE_NAME = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})*$/;

async function loadTableLocale(name: string): Promise<MRT_Localization | undefined> {
  let module: Record<string, MRT_Localization> | undefined;
  if (TABLE_LOCALE_NAME.test(name)) {
    // The bundler creates a separate chunk for each locale in the directory.
    module = await import(`material-react-table/locales/${name}/index.esm.js`).catch(
      () => undefined
    );
  }
  const locale =
    module && Object.entries(module).find(([key]) => key.startsWith('MRT_Localization_'))?.[1];
  if (!locale) {
    console.warn(`Language pack: the table has no locale named "${name}".`);
  }
  return locale;
}

async function loadMuiLocale(name: string): Promise<Localization | undefined> {
  const locales = (await import('@mui/material/locale')) as unknown as Record<
    string,
    Localization | undefined
  >;
  if (!locales[name]) {
    console.warn(`Language pack: Material UI has no locale named "${name}".`);
  }
  return locales[name];
}

async function loadUiLocales(language: string | undefined) {
  const names = language ? uiLocaleNames.get(language.toLowerCase()) : undefined;
  if (!names) {
    return;
  }
  uiLocaleNames.delete(language!.toLowerCase());

  // Locales that a plugin registered with registerLocale take precedence.
  const registered = getRegisteredLocale(names.code);
  const [muiLocale, tableLocalization] = await Promise.all([
    names.mui && !registered?.muiLocale ? loadMuiLocale(names.mui) : undefined,
    names.table && !registered?.tableLocalization ? loadTableLocale(names.table) : undefined,
  ]);
  if (!muiLocale && !tableLocalization) {
    return;
  }
  addRegisteredLocale({ code: names.code, muiLocale, tableLocalization });
  if (i18next.language?.toLowerCase() === names.code.toLowerCase()) {
    // The theme and the tables read the locales when the language is set.
    await i18next.changeLanguage(i18next.language);
  }
}

function packFileUrl(pack: LanguagePack, file: string) {
  const path = [pack.name, ...file.split('/')].map(encodeURIComponent).join('/');
  // Add the pack version to the URL, so that browsers do not use cached
  // catalogs from an older version.
  const version = pack.manifest.version;
  const query = typeof version === 'string' && version ? `?v=${encodeURIComponent(version)}` : '';
  return `${getAppUrl()}language-packs/${path}${query}`;
}

/**
 * Logs a warning if a pack changes a language that Headlamp includes and was
 * translated from an older Headlamp version. The pack's strings still replace
 * Headlamp's strings, including translations that Headlamp has fixed since.
 */
function warnIfStale(pack: LanguagePack, code: string) {
  const translatedFrom = semver.coerce(pack.manifest.translatedFrom?.headlamp);
  const running = semver.coerce(getVersion().VERSION);
  if (translatedFrom && running && semver.lt(translatedFrom, running)) {
    console.warn(
      `Language pack "${pack.name}" replaces Headlamp's "${code}" strings and was translated from Headlamp ${translatedFrom.version}, but this is Headlamp ${running.version}. Headlamp's own "${code}" translations may be newer.`
    );
  }
}

/**
 * Adds the language packs that the backend serves: languages that Headlamp
 * does not include, Headlamp's strings in any language, and plugin strings.
 * Strings in a pack replace Headlamp's strings for the same keys, and strings
 * in a later pack replace the same strings in an earlier pack.
 *
 * @param packs - The packs, as listed by the backend.
 */
export async function addLanguagePacks(packs: LanguagePack[]) {
  const available = Object.keys(supportedLanguages);
  const added: string[] = [];
  const changed = new Set<string>();

  for (const pack of packs) {
    const requestedCode = pack?.manifest?.language?.code;
    if (typeof requestedCode !== 'string' || !LANGUAGE_CODE.test(requestedCode)) {
      console.warn(`Language pack "${pack?.name}" has no valid language.code. Skipping.`);
      continue;
    }
    const known = findCode(Object.keys(supportedLanguages), requestedCode);
    const code = known ?? requestedCode;
    if (!known) {
      const { label, dir } = pack.manifest.language;
      if (!label) {
        console.warn(
          `Language pack "${pack.name}": language.label is required for "${code}", which Headlamp does not include. Skipping.`
        );
        continue;
      }
      addLanguage(code, label, dir === 'rtl' ? 'rtl' : 'ltr');
      added.push(code);
    } else if (pack.files?.some(file => HEADLAMP_CATALOG.test(file))) {
      warnIfStale(pack, code);
    }

    addPackLanguage(code);
    for (const file of pack.files ?? []) {
      const headlamp = HEADLAMP_CATALOG.exec(file);
      if (headlamp) {
        addHeadlampCatalog(code, headlamp[1], packFileUrl(pack, file));
        changed.add(code);
        continue;
      }
      const plugin = PLUGIN_CATALOG.exec(file);
      if (plugin) {
        addPluginCatalog(code, plugin[1], packFileUrl(pack, file));
      }
    }

    const { muiLocale, tableLocale } = pack.manifest;
    if (muiLocale || tableLocale) {
      const previous = uiLocaleNames.get(code.toLowerCase());
      uiLocaleNames.set(code.toLowerCase(), {
        code,
        mui: muiLocale ?? previous?.mui,
        table: tableLocale ?? previous?.table,
      });
    }
  }

  // Reload the catalogs that i18next loaded before the packs were added.
  const loaded = [...changed].filter(code =>
    sharedConfig.namespaces.some((ns: string) => i18next.hasResourceBundle(code, ns))
  );
  if (loaded.length > 0) {
    await i18next.reloadResources(loaded);
  }

  if (!listening) {
    i18next.on('languageChanged', loadUiLocales);
    listening = true;
  }
  await loadUiLocales(i18next.language);

  // Switch to a language that the packs added if the user requested it before
  // all languages that Headlamp includes.
  const requestIndex = (code: string) =>
    requestedLanguages.findIndex(candidate => isRequestedFirst(code, [candidate], []));
  const requested = added
    .filter(code => isRequestedFirst(code, requestedLanguages, available))
    .sort((a, b) => requestIndex(a) - requestIndex(b))[0];
  if (requested) {
    await i18next.changeLanguage(requested);
  } else if (
    loaded.some(code => i18next.languages?.some(lng => lng.toLowerCase() === code.toLowerCase()))
  ) {
    // Headlamp re-renders text when the language changes, but not when a
    // catalog changes.
    await i18next.changeLanguage(i18next.language);
  }
}

/**
 * Fetches the list of language packs from the backend and adds the packs. If
 * the backend has no packs, or the request fails, no packs are added.
 *
 * @param headers - Headers for the requests, such as the Backstage token.
 */
export async function loadLanguagePacks(headers: HeadersInit = {}) {
  setLanguagePackHeaders(headers);
  let packs: unknown;
  try {
    packs = await fetchJsonWithTimeout(`${getAppUrl()}language-packs`, headers, LIST_TIMEOUT_MS);
  } catch (error) {
    console.warn('Could not list the language packs:', error);
    return;
  }
  if (Array.isArray(packs) && packs.length > 0) {
    await addLanguagePacks(packs as LanguagePack[]);
  }
}

/**
 * Adds the pseudo-language, which marks every translatable string. It is added
 * when the user requests it with `?lng=en-XA`, and in development builds, where
 * it is also listed in the locale selector.
 */
export function addPseudoLanguage() {
  const requested = requestedLanguages.some(
    lng => lng.toLowerCase() === PSEUDO_LANGUAGE.toLowerCase()
  );
  if ((!requested && !isDevMode()) || supportedLanguages[PSEUDO_LANGUAGE]) {
    return;
  }
  // The catalogs are empty, so every string falls back to English, and the
  // pseudo post-processor transforms it.
  addLocale({ code: PSEUDO_LANGUAGE, label: 'Pseudo-language (en-XA)', resources: {} });
}
