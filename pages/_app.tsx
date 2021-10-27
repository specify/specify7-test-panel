import 'tailwindcss/tailwind.css';

import type { AppProps } from 'next/app';
import React from 'react';

import ErrorBoundary from '../components/ErrorBoundary';
import { LanguageProvider } from '../components/LanguageContext';
import { StatusLineProvider } from '../components/StatusLine';
import { useAuth, UserContext } from '../components/UserContext';

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export default function App({
  Component,
  pageProps,
}: Readonly<AppProps>): JSX.Element {

  const {user} = useAuth();

  return (
    <LanguageProvider>
      <ErrorBoundary>
        <StatusLineProvider>
          <UserContext.Provider value={{user}}>
            <Component {...pageProps} />
          </UserContext.Provider>
        </StatusLineProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
