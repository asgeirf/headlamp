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

import * as lib from '@kinvolk/headlamp-plugin/lib';
import { nb, PluginLocale } from './locale';
import { registerOnStockHeadlamp } from './stockHeadlamp';

const { registerLocale } = lib as unknown as {
  registerLocale?: (locale: PluginLocale) => void;
};

if (typeof registerLocale === 'function') {
  registerLocale(nb);
} else if (!registerOnStockHeadlamp(nb)) {
  console.warn('language-nb: this Headlamp version gives no way to add a language.');
}
