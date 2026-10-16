# Language Packs

This directory contains the
[language packs](../docs/development/i18n/language-packs.md) for this build of
Headlamp. `nb/` is Norwegian Bokmål, with Headlamp's strings and the strings
of the plugins that this build uses.

```
language-packs/
  sources.json          # paths to the English catalogs
  sync-catalogs.mjs     # updates the keys in the packs
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

1. Add the plugin's package name and the path to its English catalog to
   `sources.json`. For a plugin installed from a package, the English catalog
   is `locales/en/translation.json` in the package.
2. Add a collection for the plugin to `kapi.yaml`, with
   `language-packs/{lang}/plugins/<package name>/translation.json` as the
   target.
3. Run `node language-packs/sync-catalogs.mjs`, then translate with kapi. See
   [Translating with kapi](../docs/development/i18n/contributing.md#translating-with-kapi).

A pack can translate a plugin only if the plugin reads its text with
`useTranslation`.

## Updating the packs

After Headlamp or a plugin changes its English strings, run
`node language-packs/sync-catalogs.mjs`. The script adds the new English keys
to every pack with empty values, and removes the keys that are no longer in
English. An empty value is shown in English until it is translated. Then
translate the new strings with kapi, and increase `version` in `pack.json`.
