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

import { MRT_Localization_NO } from 'material-react-table/locales/no';
import app from '../locales/nb/app.json';
import glossary from '../locales/nb/glossary.json';
import translation from '../locales/nb/translation.json';
// An `@mui/material/...` import resolves to Headlamp's own Material UI at
// runtime, and that copy does not include the locales. Importing the file by
// path bundles Material UI's Norwegian strings into the plugin instead.
import { nbNO } from '../node_modules/@mui/material/locale';

/**
 * The shape `registerLocale` takes. It is declared here because the published
 * @kinvolk/headlamp-plugin types do not include it yet.
 */
export interface PluginLocale {
  code: string;
  label: string;
  dir?: 'ltr' | 'rtl';
  resources: { [namespace: string]: { [key: string]: string } };
  muiLocale?: unknown;
  tableLocalization?: unknown;
}

export const nb: PluginLocale = {
  code: 'nb',
  label: 'Norsk bokmål',
  dir: 'ltr',
  resources: { translation, glossary, app },
  muiLocale: nbNO,
  tableLocalization: MRT_Localization_NO,
};

function sameLanguage(candidate: string, code: string) {
  const c = candidate.toLowerCase();
  const k = code.toLowerCase();
  return c === k || c.split('-')[0] === k;
}

/**
 * Whether the user asked for `code` ahead of every language in `available`.
 * The same rule as Headlamp's registerLocale.
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
