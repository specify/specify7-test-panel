import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';

import Layout from '../components/Layout';
import { StatusLineContext } from '../components/StatusLine';
import { Centered } from '../components/UI';
import { statusLineContentClassName } from '../lib/statusLineConfig';
import { localization } from '../const/localization';

export default function SignIn({
  code,
}: {
  readonly code: string;
}): JSX.Element {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const signInUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:org`;

  const addStatusMessage = React.useContext(StatusLineContext);

  const router = useRouter();

  React.useEffect(() => {
    if (code.length === 0) return;

    addStatusMessage({
      message: (
        <span className={`${statusLineContentClassName} bg-blue-200`}>
          {localization.loading}
        </span>
      ),
      id: 'signInStatus',
    });

    fetch(`/api/login?code=${code}`)
      .then(async (response) => response.json())
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
              {localization.unexpectedErrorHasOccurred}:
              <br />
              {error.toString()}
            </span>
          ),
          id: 'signInStatus',
        });
      });
  }, [code]);

  return (
    <Layout title={localization.signIn} protected={false}>
      <Centered>
        <div>
          <h1 className="text-5xl">{localization.pageTitle}</h1>
          <div className="flex-column flex gap-y-1 pt-4">
            <a
              className="box-content w-full border border-gray-400 bg-gray-300 p-4 hover:bg-white"
              href={signInUrl}
            >
              {localization.signInWithGitHub}
            </a>
          </div>
        </div>
      </Centered>
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
