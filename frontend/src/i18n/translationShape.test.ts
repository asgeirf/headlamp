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

import { describe, expect, it } from 'vitest';
import { keepsShape } from './translationShape';

describe('keepsShape', () => {
  it.each([
    ['Close', 'Lukk'],
    ['Delete {{name}}?', 'Slette {{ name }}?'],
    ['Failed to run "{{ command }}"', 'Kunne ikke kjøre «{{command}}»'],
    ['{{count}} pods_one', 'Én pod'],
    ['{{count}} pods_other', '{{count}} podder'],
    ['Read <1>the docs</1>', 'Les <1>dokumentasjonen</1>'],
    ['Step one<br/>Step two', 'Steg én<br />Steg to'],
    ['Age//context:resource', 'Alder'],
    // Not English text, so it is not checked.
    ['sidebar.title', 'Sidepanel {{x}}'],
  ])('keeps %j as %j', (key, value) => {
    expect(keepsShape(key, value)).toBe(true);
  });

  it.each([
    ['Delete {{name}}?', 'Slette {{navn}}?'],
    ['Delete {{name}}?', 'Slette?'],
    ['Error parsing the code', 'Feil: {{error}}'],
    ['Failed to run "{{ command }}"', 'Échec de l\'exécution de "{commande }}"'],
    ['{{count}} pods_other', '{{antall}} podder'],
    ['Read <1>the docs</1>', 'Les dokumentasjonen'],
    ['Read <1>the docs</1>', 'Les <2>dokumentasjonen</2>'],
  ])('rejects %j as %j', (key, value) => {
    expect(keepsShape(key, value)).toBe(false);
  });
});
