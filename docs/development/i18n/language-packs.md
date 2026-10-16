---
title: Language Packs
sidebar_label: Language Packs
---

A language pack is a set of translation files that Headlamp loads when it
starts. You can use a language pack to:

- Add a language that Headlamp does not include to your Headlamp deployment.
- Translate plugins that do not include your language.
- Change the terms Headlamp uses, for example to match your organization's
  terminology.

A language pack contains only JSON files, no code. Language packs are not
plugins and are not shown in the plugin list.

Headlamp selects a pack's language in the same way as the languages it
includes: the language chosen in Settings under Language, or otherwise the
first language in the browser's or operating system's language settings that
Headlamp has.

## Pack structure

A language pack is a directory:

```
language-packs/
  nb/
    pack.json
    headlamp/
      translation.json
      glossary.json
      app.json
    plugins/
      @kinvolk/headlamp-pod-counter/
        translation.json
```

`pack.json` describes the pack:

```json
{
  "name": "nb",
  "version": "2026.10.1",
  "language": { "code": "nb", "label": "Norsk bokmål", "dir": "ltr" },
  "muiLocale": "nbNO",
  "tableLocale": "no",
  "translatedFrom": { "headlamp": "0.46.0" }
}
```

- `language.code`: The language code, for example `nb` or `pt-BR`. If
  Headlamp already includes the language, the pack changes its strings, and
  `label` and `dir` are ignored.
- `language.label`: The name of the language, written in that language. It
  is shown in the locale selector. Required for a language that Headlamp does
  not include.
- `language.dir`: The text direction, `ltr` or `rtl`. The default is `ltr`.
- `muiLocale`: Optional. The name of a
  [Material UI locale](https://mui.com/material-ui/guides/localization/),
  used for date pickers, pagination and other Material UI text.
- `tableLocale`: Optional. The name of a directory in
  `material-react-table/locales`, used for table text.
- `version`: The version of the pack. Headlamp adds it to the URLs of the
  pack's files, so that browsers do not use cached files from an older
  version. Increase it every time the files change.
- `translatedFrom.headlamp`: The Headlamp version that the pack was
  translated from. For a language that Headlamp includes, Headlamp logs a
  warning if this version is older than the running Headlamp, because the
  pack's strings then replace translations that Headlamp may have fixed since.

The Material UI and table locales are loaded the first time the language is
used.

The other files are catalogs:

- `headlamp/`: Headlamp's catalogs. They use the keys of the English catalogs
  in `frontend/src/i18n/locales/en/`. `app.json` contains the strings for the
  desktop app's menus and dialogs.
- `plugins/<package name>/translation.json`: A plugin's strings. They use the
  keys of the plugin's English catalog. The package name is the `name` field
  in the plugin's `package.json`, including the scope.

All files are optional, and a catalog can contain only some of the keys. If
a key is missing or its value is empty, Headlamp shows the string it shows
without the pack. Headlamp ignores other fields in `pack.json`, so you can
use them for your own tools.

## Which strings are used

Strings in a pack replace Headlamp's strings and the plugins' own strings for
the same keys. If more than one pack contains the same language, the packs
are applied in the alphabetical order of their directory names, and a string
in a later pack replaces the same string in an earlier pack. Strings that a
plugin registers with
[`registerLocale`](../plugins/i18n.md#adding-a-language-with-a-plugin) are
applied after all packs.

A pack can translate only the plugin text that the plugin reads with
`useTranslation`. Text that a plugin renders directly cannot be translated
by a pack.

Headlamp shows its pages after the packs are loaded, so a pack's language is
used from the first page.

## Validation

Headlamp validates packs when it loads them:

- A pack is skipped if its `pack.json` cannot be read, or if its
  `language.code` is not a valid language code. Catalogs that are not valid
  JSON, and values that are not strings, are also skipped.
- A translation is skipped if its `{{placeholders}}` or `<1>…</1>` tags
  differ from those in its English key. Headlamp then shows the English
  string, or its own translation. Plural forms can omit `{{count}}`. The
  skipped translations are listed in the browser console.
- If the list of packs is not received within 3 seconds, Headlamp starts
  without packs. If a catalog is not received within 5 seconds, the language
  is loaded without it, and the catalog is requested again the next time the
  language is loaded.

Translations are rendered as text, so a pack cannot add HTML or scripts to
the page.

## Installing packs

The Headlamp backend serves the packs in the directory set by the
`-language-packs-dir` flag or the `HEADLAMP_CONFIG_LANGUAGE_PACKS_DIR`
environment variable.

### In a cluster

A ConfigMap can store a pack. ConfigMap keys cannot contain `/`, so map each
key to its path in the pack:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: headlamp-language-packs
data:
  nb.pack.json: |
    {"language": {"code": "nb", "label": "Norsk bokmål"}, "muiLocale": "nbNO", "tableLocale": "no"}
  nb.translation.json: |
    {"Close": "Lukk"}
```

```yaml
# values.yaml for the Headlamp chart
config:
  extraArgs:
    - -language-packs-dir=/headlamp/language-packs
volumes:
  - name: language-packs
    configMap:
      name: headlamp-language-packs
      items:
        - key: nb.pack.json
          path: nb/pack.json
        - key: nb.translation.json
          path: nb/headlamp/translation.json
volumeMounts:
  - name: language-packs
    mountPath: /headlamp/language-packs
```

To add packs to a container image instead, copy them into the image and set
the environment variable:

```dockerfile
FROM ghcr.io/headlamp-k8s/headlamp:latest
COPY language-packs /headlamp/language-packs
ENV HEADLAMP_CONFIG_LANGUAGE_PACKS_DIR=/headlamp/language-packs
```

### In the desktop app

To include packs in a build of the desktop app, add their directory to the
`resources` in the [app build manifest](../app.md#build-manifest-resources),
with `language-packs` as the target:

```json
{
  "resources": {
    "common": [{ "from": "./language-packs", "to": "language-packs" }]
  }
}
```

The packaged app loads the packs in its `language-packs` resources directory.
To load packs from another directory, or when you run the app from source,
set `HEADLAMP_CONFIG_LANGUAGE_PACKS_DIR`. The menus and dialogs use the
strings in the packs' `app.json` files from startup.

## Finding text that cannot be translated

Headlamp has a pseudo-language, `en-XA`, for finding text that a pack cannot
translate. To use it, open Headlamp with `?lng=en-XA`. Development builds
also list it in the locale selector.

In the pseudo-language, every string that Headlamp and plugins pass to `t()`
is shown with accented letters and in brackets: «Settings» is shown as
«[Šéţţîñĝš]». This includes strings that no catalog contains yet, and the
table and Material UI strings that a pack translates with `tableLocale` and
`muiLocale`. Values inserted into a string, such as a pod name, are not
changed.

Text that is still in plain English does not go through `t()`. Either the
plugin renders it directly, or it passes the text to Headlamp without `t()`.
To translate this text, the plugin must be changed.

Sidebar entry labels are an exception. For an entry that a plugin registers
while it loads, Headlamp looks up the label in the plugin's translations,
with the label as the key. To translate the label, add it to the plugin's
catalog in the pack. Labels of entries registered later, for example from a
callback, are not translated.

## Updating a pack

The keys of a pack are the English strings. When Headlamp or a plugin changes
its English strings, the changed strings are shown in English until the pack
is updated. Keys that are no longer used are ignored.

To find the strings to translate, compare the pack's catalogs with the
English catalogs: Headlamp's in `frontend/src/i18n/locales/en/`, and each
plugin's in its `locales/en/` directory. For a plugin without an English
catalog, use the strings that its source code passes to `t()`.
