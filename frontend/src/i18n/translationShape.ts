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

// {{name}} and {{name, format}} placeholders, by name.
const PLACEHOLDER = /\{\{\s*([^\s,}]+)[^}]*\}\}/g;
// The tags that <Trans> uses: numbered components and the basic HTML elements it keeps.
const TAG = /<\/?(?:\d+|br|strong|i|p)\s*\/?>/g;
const PLURAL_SUFFIX = /_(?:zero|one|two|few|many|other)$/;
const CONTEXT_SEPARATOR = '//context:';

function placeholders(text: string) {
  return new Set([...text.matchAll(PLACEHOLDER)].map(match => match[1]));
}

function tags(text: string) {
  return [...text.matchAll(TAG)].map(match => match[0].replace(/\s/g, '')).sort();
}

/**
 * Returns whether a translation has the same placeholders and `<Trans>` tags
 * as its key, the English text. If a translation removes or adds a placeholder,
 * or changes the tags, `{{name}}` can be shown literally or a link can be lost.
 * A plural form can omit `{{count}}`, as in "one pod". Some languages also
 * write out the number in other plural forms. Keys that are not English text,
 * such as `sidebar.title`, are not checked.
 *
 * @param key - The catalog key: the English string, with any plural suffix
 *   or context.
 * @param value - The translation.
 */
export function keepsShape(key: string, value: string) {
  const plural = PLURAL_SUFFIX.test(key);
  const english = key.replace(PLURAL_SUFFIX, '').split(CONTEXT_SEPARATOR)[0];
  if (!/\s|\{\{|</.test(english)) {
    return true;
  }
  const wanted = placeholders(english);
  const found = placeholders(value);
  for (const name of found) {
    if (!wanted.has(name)) {
      return false;
    }
  }
  for (const name of wanted) {
    if (!found.has(name) && !(plural && name === 'count')) {
      return false;
    }
  }
  const englishTags = tags(english);
  const valueTags = tags(value);
  return (
    englishTags.length === valueTags.length && englishTags.every((tag, i) => tag === valueTags[i])
  );
}
