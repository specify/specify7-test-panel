import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';

import FilterUsers from '../components/FilterUsers';
import { LanguageContext } from '../components/LanguageContext';
import Layout from '../components/Layout';
import { Centered } from '../components/UI';
import siteInfo from '../const/siteInfo';
import type { LocalizationStrings } from '../lib/languages';
import { StatusLineContext } from '../components/StatusLine';
import { statusLineContentClassName } from '../lib/statusLineConfig';

const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly signInWithGitHub: string;
  readonly unexpectedErrorHasOccurred: string;
  readonly loading: string;
}> = {
  'en-US': {
    title: 'Sign In ',
    signInWithGitHub: 'Sign in with GitHub',
    unexpectedErrorHasOccurred: 'Unexpected error has occurred',
    loading: 'Loading...',
  },
};

export default function SignIn({
  code,
}: {
  readonly code: string;
}): JSX.Element {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const signInUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:org`;

  const addStatusMessage = React.useContext(StatusLineContext);

  const router = useRouter();

  const language = React.useContext(LanguageContext);

  const languageStrings = localizationStrings[language];

  React.useEffect(() => {
    if (code.length === 0) return;

    addStatusMessage({
      message: (
        <span className={`${statusLineContentClassName} bg-blue-200`}>
          {languageStrings.loading}
        </span>
      ),
      id: 'signInStatus',
    });

    fetch(`/api/login?code=${code}`)
      .then((response) => response.json())
      .then((response) => {
        if (response.error.length > 0) throw new Error(response.error);

        const isSecure = window.location.protocol === 'https:';
        const cookieString = Object.entries({
          token: response.data,
          path: '/',
          'mag-age': 60 * 60 * 24 * 365,
          samesite: 'strict',
        })
          .map(([key, value]) => `${key}=${value}`)
          .join('; ');
        document.cookie = isSecure ? `${cookieString}; secure` : cookieString;
        router.push('/').catch(console.error);
      })
      .catch((error) => {
        console.error(error);
        addStatusMessage({
          message: (
            <span className={`${statusLineContentClassName} bg-red-200`}>
              {languageStrings.unexpectedErrorHasOccurred}:
              <br />
              {error.toString()}
            </span>
          ),
          id: 'signInStatus',
        });
      });
  }, [code, language]);

  return (
    <Layout title={localizationStrings}>
      {(_languageStrings, language): JSX.Element => (
        <FilterUsers>
          <Centered>
            <div>
              <h1 className="text-5xl">{siteInfo[language].title}</h1>
              <div className="flex-column gap-y-1 flex pt-4">
                <a
                  href={signInUrl}
                  className="hover:bg-white box-content w-full p-4 bg-gray-300 border border-gray-400"
                >
                  {languageStrings.signInWithGitHub}
                </a>
              </div>
            </div>
          </Centered>
        </FilterUsers>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<{
  readonly code: string | undefined;
}> = async (context) => ({
  props: {
    code: (context.query.code as string) ?? '',
  },
});
