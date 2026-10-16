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

import i18next, { type PostProcessorModule, type TOptions } from 'i18next';

/**
 * A pseudo-language for finding text that cannot be translated. Every string
 * that Headlamp or a plugin passes to `t()` is shown with accented letters and
 * in brackets: «Settings» is shown as «[Šéţţîñĝš]». Text that is still in plain
 * English does not go through `t()`, so catalogs and language packs cannot
 * translate it.
 */
export const PSEUDO_LANGUAGE = 'en-XA';

// Each letter, and the accented letter that replaces it.
const PLAIN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ACCENTED = Array.from('áƀçðéƒĝĥîĵķļɱñöþǫŕšţûṽŵẋýžÅƁÇÐÉƑĜĤÎĴĶĻṀÑÖÞǪŔŠŢÛṼŴẊÝŽ');

// Markup and placeholders that are not changed: <1>…</1> tags for <Trans>,
// {{name}} placeholders, the table's {column} placeholders, and $t(key)
// nesting.
const PROTECTED = String.raw`<\/?\d+\/?>|<\/?[a-zA-Z][^>]*>|\{\{[^}]*\}\}|\{[a-zA-Z]+\}|\$t\([^)]*\)`;

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function accent(text: string) {
  return text.replace(/[a-zA-Z]/g, letter => ACCENTED[PLAIN.indexOf(letter)]);
}

/**
 * Replaces the letters of a string with accented letters and adds brackets.
 * Markup, placeholders and the given values are not changed.
 *
 * @param text - The string as `t()` returns it.
 * @param values - Values inserted into the string, such as a pod's name.
 */
export function pseudoLocalize(text: string, values: string[] = []) {
  const kept = values
    .filter(value => value.length > 0)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  const token = new RegExp(`(${[PROTECTED, ...kept].join('|')})`, 'g');
  // With one capture group, split() returns text and tokens alternately.
  const out = text
    .split(token)
    .map((part, index) => (index % 2 === 1 ? part : accent(part)))
    .join('');
  return `[${out}]`;
}

const I18NEXT_OPTIONS = new Set([
  'lng',
  'lngs',
  'ns',
  'defaultValue',
  'context',
  'fallbackLng',
  'keySeparator',
  'nsSeparator',
  'postProcess',
  'interpolation',
  'returnObjects',
  'returnDetails',
  'joinArrays',
  'ordinal',
]);

function insertedValues(options: TOptions | undefined) {
  if (!options) {
    return [];
  }
  const source = { ...options, ...(options.replace as object | undefined) };
  return Object.entries(source)
    .filter(
      ([key, value]) => !I18NEXT_OPTIONS.has(key) && ['string', 'number'].includes(typeof value)
    )
    .map(([, value]) => String(value));
}

/** Whether the pseudo-language is selected in Headlamp. */
export function isPseudoLanguage() {
  // Headlamp uses the default i18next instance. Plugin instances, and the
  // language code that Headlamp's components read, use the resolved language,
  // which is English for the pseudo-language.
  return i18next.language === PSEUDO_LANGUAGE;
}

const localizedObjects = new WeakMap<object, unknown>();

/**
 * Returns a copy of a locale object, such as the English Material UI or table
 * strings, with `pseudoLocalize` applied to every string and to the return
 * value of every function.
 */
export function pseudoLocalizeAll<T>(value: T): T {
  if (typeof value === 'string') {
    return pseudoLocalize(value) as T;
  }
  if (typeof value === 'function') {
    return ((...args: unknown[]) => pseudoLocalizeAll(value(...args))) as T;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (!localizedObjects.has(value)) {
    const copy = Array.isArray(value)
      ? value.map(pseudoLocalizeAll)
      : Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, pseudoLocalizeAll(item)])
        );
    localizedObjects.set(value, copy);
  }
  return localizedObjects.get(value) as T;
}

/**
 * An i18next post-processor that applies `pseudoLocalize` when the
 * pseudo-language is selected. Headlamp registers it on its own i18next
 * instance and on each plugin's instance.
 */
export const pseudoPostProcessor: PostProcessorModule = {
  type: 'postProcessor',
  name: 'pseudo',
  process(value: string, _key: string | string[], options: TOptions) {
    // Do not use the lng option here: i18next sets it to the resolved language.
    if (!isPseudoLanguage() || typeof value !== 'string') {
      return value;
    }
    return pseudoLocalize(value, insertedValues(options));
  },
};
