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

import FormControl, { FormControlProps } from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../config';
import {
  getLanguagePackInfo,
  getLanguagePackInfoVersion,
  subscribeLanguagePackInfo,
} from '../languagePackCatalogs';
import { getRegisteredLocalesVersion, subscribeRegisteredLocales } from '../localeRegistry';

export interface LocaleSelectProps {
  /** Whether to show the title label above the select dropdown. */
  showTitle?: boolean;
  /** Whether to display full names of languages instead of their language codes. */
  showFullNames?: boolean;
  /** Additional props to pass to the underlying Material-UI `FormControl` component. */
  formControlProps?: FormControlProps;
  /** Whether to show the language packs for the selected language, with the versions they were translated from. */
  showLanguagePacks?: boolean;
}

/**
 * Formats a value from a pack or a plugin's package for display in Settings:
 * as text, truncated to 80 characters.
 */
function displayText(text: unknown) {
  const characters = Array.from(String(text ?? ''));
  return characters.length > 80 ? `${characters.slice(0, 79).join('')}…` : characters.join('');
}

/**
 * A UI for selecting the locale with i18next
 */
export default function LocaleSelect(props: LocaleSelectProps) {
  const { formControlProps, showFullNames, showLanguagePacks } = props;
  const { t, i18n } = useTranslation();
  const packInfoVersion = React.useSyncExternalStore(
    subscribeLanguagePackInfo,
    getLanguagePackInfoVersion
  );
  const packs = React.useMemo(
    () => {
      if (!showLanguagePacks) {
        return [];
      }
      const selected = getLanguagePackInfo(i18n.language);
      return selected.length > 0 ? selected : getLanguagePackInfo(i18n.resolvedLanguage);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showLanguagePacks, i18n.language, i18n.resolvedLanguage, packInfoVersion]
  );
  // Plugins can add languages after the first render.
  const localesVersion = React.useSyncExternalStore(
    subscribeRegisteredLocales,
    getRegisteredLocalesVersion
  );
  /**
   * Returns a memoized mapping of language codes to their full names if showFullNames is true.
   *
   * @returns An object where keys are language codes and values are full names, or an empty object if showFullNames is false.
   */
  const fullNames = React.useMemo(() => {
    if (!showFullNames) {
      return {};
    }

    return getFullNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFullNames, localesVersion]);

  /**
   * Handles the change in language selection.
   *
   * @param event - The event triggered by selecting a new language from the dropdown.
   */
  const changeLng = (event: SelectChangeEvent<string>) => {
    const lng = event.target.value as string;

    i18n.changeLanguage(lng);
  };

  /**
   * Retrieves full language names for supported languages from the i18next configuration.
   *
   * @returns An object mapping language codes to their full names.
   */
  function getFullNames() {
    if (!i18n?.options?.supportedLngs) {
      return {};
    }

    const fullNames: { [langCore: string]: string } = {};
    i18n?.options?.supportedLngs.forEach((lng: string) => {
      if (!lng) {
        return;
      }

      fullNames[lng] = supportedLanguages[lng]?.label || lng;
    });

    return fullNames;
  }

  // Select has a problem with aria-controls not being stable under test.
  const extraInputProps = import.meta.env.UNDER_TEST ? { 'aria-controls': 'under-test' } : {};

  return (
    <FormControl {...formControlProps}>
      {props.showTitle && <FormLabel component="legend">{t('Select locale')}</FormLabel>}
      <Select
        value={i18n.resolvedLanguage || i18n.language || 'en'}
        onChange={changeLng}
        size="small"
        variant="outlined"
        SelectDisplayProps={extraInputProps}
        inputProps={{ 'aria-label': t('Select locale'), ...extraInputProps }}
      >
        {(i18n?.options?.supportedLngs || [])
          .filter(lng => lng !== 'cimode')
          .map(lng => (
            <MenuItem value={lng} key={lng}>
              {showFullNames ? fullNames[lng] : lng}
            </MenuItem>
          ))}
      </Select>
      {packs.map(pack => {
        const name = displayText(pack.version ? `${pack.name} ${pack.version}` : pack.name);
        return (
          <FormHelperText key={pack.name}>
            {pack.headlamp
              ? t('Language pack {{pack}}, for Headlamp {{headlamp}}', {
                  pack: name,
                  headlamp: displayText(pack.headlamp),
                })
              : t('Language pack {{pack}}', { pack: name })}
            {pack.older &&
              ` ${t('Made for an earlier Headlamp: some text may be in English or out of date.')}`}
            {(pack.updatedPlugins ?? []).map(
              plugin =>
                ` ${t(
                  'Made for {{plugin}} {{version}}, and {{installed}} is installed: some of its text may be in English.',
                  {
                    plugin: displayText(plugin.name),
                    version: displayText(plugin.translatedFrom),
                    installed: displayText(plugin.installed),
                  }
                )}`
            )}
          </FormHelperText>
        );
      })}
    </FormControl>
  );
}
