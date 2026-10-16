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

import React from 'react';
import { useTranslation } from 'react-i18next';
import { isElectron } from '../helpers/isElectron';
import { getRegisteredLocale } from './localeRegistry';

// If we're running under electron, we need to communicate any language changes.
const ipcRenderer = isElectron() ? window.desktopApi : null;

/**
 * Returns the `app` strings that plugins registered for a language and for
 * English, the fallback language. The Electron process uses these strings for
 * the menus and dialogs, because it does not load plugins. A language without
 * plugin strings is sent as an empty object, so that the Electron process
 * removes strings from plugins that are no longer loaded.
 */
function pluginAppStrings(lang: string) {
  const strings: Record<string, Record<string, string>> = {};
  for (const code of new Set([lang, 'en'])) {
    strings[code] = getRegisteredLocale(code)?.resources?.app ?? {};
  }
  return strings;
}

function tellAppAboutLanguage(lang: string) {
  if (ipcRenderer && lang) {
    ipcRenderer.send('locale-strings', pluginAppStrings(lang));
    ipcRenderer.send('locale', lang);
  }
}

/** Integration with Electron app, so it can change locale information. */
export function useElectronI18n() {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    // The Electron process keeps running when this page reloads, so send the
    // current language as well as later changes.
    tellAppAboutLanguage(i18n.language);
    i18n.on('languageChanged', tellAppAboutLanguage);
    return () => {
      i18n.off('languageChanged', tellAppAboutLanguage);
    };
  }, [i18n]);
}
