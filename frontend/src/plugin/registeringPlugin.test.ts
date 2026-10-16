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

import { describe, expect, it, vi } from 'vitest';
import store from '../redux/stores/store';
import { getRegisteringPlugin } from './registeringPlugin';
import { registerSidebarEntry } from './registry';
import { runPlugin } from './runPlugin';

describe('the registering plugin', () => {
  it('is set while a plugin runs, and unset afterwards', () => {
    const seen: (string | undefined)[] = [];
    const capture = () => seen.push(getRegisteringPlugin());

    runPlugin('capture();', '@scope/first', '1.0.0', vi.fn(), Function, ['capture'], [capture]);
    expect(seen).toEqual(['@scope/first']);
    expect(getRegisteringPlugin()).toBeUndefined();

    const handleError = vi.fn();
    runPlugin(
      'capture(); throw new Error("boom");',
      'second',
      '1.0.0',
      handleError,
      Function,
      ['capture'],
      [capture]
    );
    expect(seen).toEqual(['@scope/first', 'second']);
    expect(handleError).toHaveBeenCalled();
    expect(getRegisteringPlugin()).toBeUndefined();
  });

  it('is stored on the sidebar entries that a plugin registers while it runs', () => {
    const register = () =>
      registerSidebarEntry({ name: 'from-plugin', label: 'Overview', url: '/overview' });
    runPlugin('register();', '@scope/flux', '1.0.0', vi.fn(), Function, ['register'], [register]);
    expect(store.getState().sidebar.entries['from-plugin'].pluginName).toBe('@scope/flux');

    registerSidebarEntry({ name: 'later', label: 'Later', url: '/later' });
    expect(store.getState().sidebar.entries['later'].pluginName).toBeUndefined();
  });
});
