import Head from 'next/head';
import React from 'react';

import commonLocalizationStrings from '../const/commonStrings';
import siteInfo from '../const/siteInfo';
import type { Language, LocalizationStrings } from '../lib/languages';
import { GetUserLanguage } from './LanguageContext';
import { RA } from '../lib/typescriptCommonTypes';

function extractTitle(
  language: Language,
  title:
    | LocalizationStrings<{
        readonly title: string;
      }>
    | string
    | ((string: Language) => string)
): string {
  if (title === '') return siteInfo[language].title;

  const titleString =
    typeof title === 'object'
      ? title[language].title
      : typeof title === 'function'
      ? title(language)
      : title;

  return titleString.endsWith(' ')
    ? `${titleString}- ${siteInfo[language].title}`
    : titleString;
}

export default function Layout<
  DEFINITIONS extends Record<
    string,
    string | ((...arguments_: RA<never>) => unknown)
  > = Record<never, string | ((...arguments_: RA<never>) => unknown)>
>({
  title,
  children,
  localizationStrings,
}: {
  readonly title:
    | LocalizationStrings<{
        readonly title: string;
      }>
    | string
    | ((string: Language) => string);
  readonly children: (
    languageStrings: DEFINITIONS,
    language: Language,
    commonStrings: Readonly<typeof commonLocalizationStrings[Language]>
  ) => React.ReactNode;
  readonly localizationStrings?: LocalizationStrings<DEFINITIONS>;
}): JSX.Element {
  return (
    <GetUserLanguage localizationStrings={siteInfo}>
      {(_siteInfoStrings, language: Language): JSX.Element => (
        <>
          <Head>
            <title>{extractTitle(language, title)}</title>
            <link href="/favicon.ico" rel="icon" />
            <meta content="noindex,nofollow" name="robots" />
          </Head>
          <main className="flex h-screen w-full flex-col gap-10 overflow-auto p-8">
            {children(
              /*
               * Need to cheat here a little bit if definitions were not
               * provided, children's first argument would be of type
               * Record<never,string|Function> because `DEFINITIONS` would
               * use it's default value in that case
               */
              typeof localizationStrings === 'undefined'
                ? (undefined as unknown as DEFINITIONS)
                : localizationStrings[language],
              language,
              commonLocalizationStrings[language]
            )}
          </main>
        </>
      )}
    </GetUserLanguage>
  );
}
