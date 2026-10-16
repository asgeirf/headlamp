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

// The package name of the plugin whose code is running. Plugins make most of
// their registrations when their code first runs, so these registrations can
// be linked to the plugin. Registrations made later, from a callback or an
// effect, are not linked to a plugin.
let registeringPlugin: string | undefined;

/** Returns the plugin whose code is running, if any. */
export function getRegisteringPlugin() {
  return registeringPlugin;
}

/** Sets the plugin whose code is running. runPlugin calls it before and after each plugin. */
export function setRegisteringPlugin(packageName: string | undefined) {
  registeringPlugin = packageName;
}
