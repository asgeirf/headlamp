# Language Packs

This directory contains the
[language packs](../docs/development/i18n/language-packs.md) for this build of
Headlamp. `nb/` is Norwegian Bokmål, with Headlamp's strings and the strings
of the plugins that this build uses.

```
language-packs/
  sources.json          # where to read the English strings
  sync-catalogs.mjs     # extracts the English strings and updates the packs
  source/
    plugins/<name>/     # each plugin's English strings, the source for kapi
  nb/
    pack.json
    headlamp/           # Headlamp's catalogs
    plugins/<name>/     # each plugin's catalog, by package name
```

## Running Headlamp with the packs

To serve the packs, start the backend with this directory:

```bash
cd backend && go run ./cmd -dev -language-packs-dir ../language-packs
```

For the desktop app, set `HEADLAMP_CONFIG_LANGUAGE_PACKS_DIR` to this
directory. To include the packs in a desktop build, add this directory to the
`resources` in `app/app-build-manifest.json`. The `from` path is relative
to the manifest:

```json
"resources": {
  "common": [{ "from": "../language-packs", "to": "language-packs" }]
}
```

## Translating a plugin

1. Add the plugin to `sources.json`, with its package name as the key:

   ```json
   "@headlamp-k8s/flux": {
     "catalog": "vendor/flux/locales/en/translation.json",
     "code": "vendor/flux/main.js",
     "keys": []
   }
   ```

   - `catalog`: The plugin's English catalog, `locales/en/translation.json`,
     if the plugin has one.
   - `code`: The plugin's source directory or its built `main.js`, as one
     path or a list of paths. The script extracts the labels of the sidebar
     entries that the plugin registers from this code, because Headlamp
     translates these labels and the plugin's catalog does not contain them.
     Only labels written as string literals can be extracted.
   - `keys`: Other English strings to translate, such as labels that the code
     creates at run time.

   For a plugin with only a catalog, the value can be the path to the catalog.
2. Add a collection for the plugin to `kapi.yaml`, with
   `language-packs/source/plugins/<package name>/translation.json` as the
   source and `language-packs/{lang}/plugins/<package name>/translation.json`
   as the target.
3. Run `node language-packs/sync-catalogs.mjs`, then translate with kapi. See
   [Translating with kapi](../docs/development/i18n/contributing.md#translating-with-kapi).

Apart from sidebar labels, a pack can translate only the text that a plugin
reads with `useTranslation`. To see which text that is, open Headlamp with
`?lng=en-XA`.

## Updating the packs

After Headlamp or a plugin changes its English strings, run
`node language-packs/sync-catalogs.mjs`. The script extracts each plugin's
English strings to `source/` again, adds the new English keys to every pack
with empty values, and removes the keys that are no longer in English. An
empty value is shown in English until it is translated. Then translate the
new strings with kapi, and increase `version` in `pack.json`.
