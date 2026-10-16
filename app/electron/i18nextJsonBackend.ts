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

import type { BackendModule } from 'i18next';
import { readFile } from 'node:fs';
import path from 'node:path';

/**
 * Loads only Headlamp's JSON locale format, avoiding the generic filesystem
 * backend's unused format parsers in the Electron startup heap.
 *
 * @param localesDir - Directory containing locale and namespace JSON files.
 * @param extraStrings - Strings that override a catalog's strings, such as the
 *   strings from language packs. A language with extra strings does not need a
 *   JSON file.
 * @returns An i18next backend that reads JSON locale resources.
 */
export function createJsonBackend(
  localesDir: string,
  extraStrings: (language: string, namespace: string) => Record<string, string> | undefined = () =>
    undefined
): BackendModule {
  return {
    type: 'backend',
    init() {},
    read(language, namespace, callback) {
      const extra = extraStrings(language, namespace);
      readFile(path.join(localesDir, language, `${namespace}.json`), 'utf8', (error, data) => {
        if (error) {
          if (extra) {
            callback(null, extra);
          } else {
            callback(error, false);
          }
          return;
        }

        try {
          callback(null, { ...JSON.parse(data), ...extra });
        } catch (error) {
          callback(error as Error, false);
        }
      });
    },
  };
}
