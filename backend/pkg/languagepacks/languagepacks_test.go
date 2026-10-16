/*
Copyright 2025 The Kubernetes Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package languagepacks_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/kubernetes-sigs/headlamp/backend/pkg/languagepacks"
	"github.com/stretchr/testify/require"
)

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	require.NoError(t, os.MkdirAll(filepath.Dir(path), 0o750))
	require.NoError(t, os.WriteFile(path, []byte(content), 0o600))
}

func TestList(t *testing.T) {
	dir := t.TempDir()

	writeFile(t, filepath.Join(dir, "nb", "pack.json"), `{"language":{"code":"nb","label":"Norsk bokmål"}}`)
	writeFile(t, filepath.Join(dir, "nb", "headlamp", "translation.json"), `{}`)
	writeFile(t, filepath.Join(dir, "nb", "plugins", "@scope", "plugin", "translation.json"), `{}`)
	writeFile(t, filepath.Join(dir, "nb", "README.md"), "not a catalog")
	writeFile(t, filepath.Join(dir, "en-terms", "pack.json"), `{"language":{"code":"en"}}`)
	writeFile(t, filepath.Join(dir, "no-code", "pack.json"), `{"language":{}}`)
	writeFile(t, filepath.Join(dir, "broken", "pack.json"), `{`)
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "no-manifest"), 0o750))
	writeFile(t, filepath.Join(dir, "stray.json"), `{}`)

	packs, err := languagepacks.List(dir)
	require.NoError(t, err)
	require.Len(t, packs, 2)

	require.Equal(t, "en-terms", packs[0].Name)
	require.Empty(t, packs[0].Files)

	require.Equal(t, "nb", packs[1].Name)
	require.JSONEq(t, `{"language":{"code":"nb","label":"Norsk bokmål"}}`, string(packs[1].Manifest))
	require.Equal(t, []string{"headlamp/translation.json", "plugins/@scope/plugin/translation.json"}, packs[1].Files)
}

func TestListMissingDir(t *testing.T) {
	packs, err := languagepacks.List(filepath.Join(t.TempDir(), "missing"))
	require.NoError(t, err)
	require.Empty(t, packs)
}
