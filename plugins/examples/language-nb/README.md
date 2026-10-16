# Norwegian Bokmål Language Plugin

This plugin adds Norwegian Bokmål (`nb`) to Headlamp. It carries Headlamp's
own catalogs in Norwegian and Material UI's and the tables' Norwegian strings,
and registers them with `registerLocale`.

```bash
cd plugins/examples/language-nb
npm install
npm start
```

Once the plugin is loaded, "Norsk bokmål" appears in the locale selector under
Settings. Headlamp switches to it when the user chose it on an earlier visit,
opens Headlamp with `?lng=nb`, or lists Norwegian ahead of every language
Headlamp already has in the browser's language settings.

Other plugins translate their own strings into `nb` as they do for any
language: they list `nb` under `headlamp.i18n` in their `package.json` and keep
`locales/nb/translation.json`. The [pod-counter example](../pod-counter/) does
this.

## The catalogs

`locales/nb/` holds Headlamp's three catalogs, `translation.json`,
`glossary.json` and `app.json`, with the same keys as the English catalogs in
`frontend/src/i18n/locales/en/`. A key the Norwegian catalog lacks shows the
English string. After Headlamp's English strings change,
`npm run sync-catalogs` adds the new keys with empty values and removes the
keys English no longer has. The `headlamp-ui` collection in the repository's
`kapi.yaml` writes them here, so `kapi status`, `kapi up` and
`kapi check --ship` work on this directory. See
[Translating with kapi](../../../docs/development/i18n/contributing.md#translating-with-kapi)
and [Norwegian terminology](../../../docs/development/i18n/norwegian-terminology.md).

The catalogs are bundled into `main.js` when the plugin is built, so a new
translation reaches users with a new build of the plugin.

## Headlamp releases without registerLocale

Headlamp 0.46.0 and earlier have no `registerLocale`. On those releases the
plugin falls back to [src/stockHeadlamp.ts](src/stockHeadlamp.ts), which finds
Headlamp's i18next instance in the React tree and adds the language to it.
That relies on React's internal fields and can stop working with any React or
Headlamp upgrade. It also covers less:

- The locale selector shows `nb` instead of "Norsk bokmål".
- Material UI and the tables stay in English, because the maps that select
  their strings are part of Headlamp's code.
- Headlamp stores English as the language on every start, so the plugin keeps
  the user's choice under a key of its own.
- The desktop app's menus and dialogs stay in English, because Headlamp passes
  the plugin's `app` strings to the Electron process only through
  `registerLocale`.

## The desktop app

The desktop app's menus and native dialogs use `locales/nb/app.json` once the
page has loaded the plugin. Dialogs shown before then are in English.
