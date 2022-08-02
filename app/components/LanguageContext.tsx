import { useRouter } from 'next/router';
import React from 'react';

import type { Language, LocalizationStrings } from '../lib/languages';
import { DEFAULT_LANGUAGE } from '../lib/languages';
import { RA } from '../lib/typescriptCommonTypes';

export const LanguageContext = React.createContext<Language>(DEFAULT_LANGUAGE);
LanguageContext.displayName = 'LanguageContext';

export function GetUserLanguage<
  DEFINITIONS extends Readonly<
    Record<string, string | ((...arguments_: RA<never>) => unknown)>
  >
>({
  localizationStrings,
  children,
}: {
  readonly localizationStrings: LocalizationStrings<DEFINITIONS>;
  readonly children: (
    languageStrings: DEFINITIONS,
    language: Language
  ) => React.ReactNode;
}): JSX.Element {
  return (
    <LanguageContext.Consumer>
      {(language): React.ReactNode =>
        children(localizationStrings[language], language)
      }
    </LanguageContext.Consumer>
  );
}

export function LanguageProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  const { defaultLocale = 'en-US', locale = defaultLocale } = useRouter();

  return (
    <LanguageContext.Provider value={locale}>
      {children}
    </LanguageContext.Provider>
  );
}
