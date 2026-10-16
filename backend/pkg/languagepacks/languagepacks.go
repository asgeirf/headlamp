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

// Package languagepacks lists the language packs in a directory.
//
// A language pack is a directory with a pack.json manifest and JSON catalogs:
// Headlamp's catalogs in headlamp/, and plugin catalogs in
// plugins/<package name>/. Packs do not contain code.
package languagepacks

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/kubernetes-sigs/headlamp/backend/pkg/logger"
)

// ManifestFile is the name of a pack's manifest.
const ManifestFile = "pack.json"

// Pack is a language pack in the format the frontend reads.
type Pack struct {
	// Name is the name of the pack's directory. The pack's files are served
	// under this name.
	Name string `json:"name"`
	// Manifest is the content of the pack's pack.json.
	Manifest json.RawMessage `json:"manifest"`
	// Files lists the pack's catalogs relative to its directory, with forward slashes.
	Files []string `json:"files"`
}

type manifest struct {
	Language struct {
		Code string `json:"code"`
	} `json:"language"`
}

// List returns the packs in dir, sorted by name. If dir does not exist, List
// returns no packs. Subdirectories without a manifest are skipped. Packs with a
// manifest that cannot be read are logged and skipped.
func List(dir string) ([]Pack, error) {
	entries, err := os.ReadDir(dir)
	if errors.Is(err, fs.ErrNotExist) {
		return []Pack{}, nil
	}

	if err != nil {
		return nil, err
	}

	packs := []Pack{}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		pack, err := read(filepath.Join(dir, entry.Name()), entry.Name())
		if errors.Is(err, fs.ErrNotExist) {
			continue
		}

		if err != nil {
			logger.Log(logger.LevelWarn, map[string]string{"pack": entry.Name()}, err, "skipping language pack")

			continue
		}

		packs = append(packs, pack)
	}

	return packs, nil
}

func read(dir, name string) (Pack, error) {
	manifestPath := filepath.Join(dir, ManifestFile)

	data, err := os.ReadFile(filepath.Clean(manifestPath))
	if err != nil {
		return Pack{}, err
	}

	var m manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return Pack{}, fmt.Errorf("reading %s: %w", ManifestFile, err)
	}

	if m.Language.Code == "" {
		return Pack{}, fmt.Errorf("%s has no language.code", ManifestFile)
	}

	files := []string{}

	err = filepath.WalkDir(dir, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !entry.Type().IsRegular() || path == manifestPath || !strings.HasSuffix(entry.Name(), ".json") {
			return nil
		}

		rel, err := filepath.Rel(dir, path)
		if err != nil {
			return err
		}

		files = append(files, filepath.ToSlash(rel))

		return nil
	})
	if err != nil {
		return Pack{}, err
	}

	return Pack{Name: name, Manifest: data, Files: files}, nil
}
