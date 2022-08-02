import Link from 'next/link';
import React from 'react';

import Layout from '../components/Layout';
import type { Language, LocalizationStrings } from '../lib/languages';
import { Centered } from './UI';

const localizationStrings: LocalizationStrings<{
  readonly header: string;
  readonly message: string;
  readonly returnToHomePage: string;
}> = {
  'en-US': {
    header: 'Oops! Nothing was found',
    message: `The page you are looking for might have been removed,
      had its name changed or is temporarily unavailable.`,
    returnToHomePage: '← Return to homepage',
  },
};

export default function ErrorPage({
  errorCode,
}: {
  readonly errorCode: number;
}): JSX.Element {
  return (
    <Layout
      localizationStrings={localizationStrings}
      title={errorCode.toString()}
    >
      {(
        languageStrings: Readonly<typeof localizationStrings[Language]>
      ): JSX.Element => (
        <Centered>
          <div className="text-center">
            <h1 className="py-2 text-9xl text-indigo-300">{errorCode}</h1>
            <h2>{languageStrings.header}</h2>
            <p>
              {languageStrings.message}
              <Link href="/">
                <a className="block pt-10 text-red-400 transition hover:text-black">
                  {languageStrings.returnToHomePage}
                </a>
              </Link>
            </p>
          </div>
        </Centered>
      )}
    </Layout>
  );
}
