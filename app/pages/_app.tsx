import 'tailwindcss/tailwind.css';

import type { AppProps } from 'next/app';
import React from 'react';
import Modal from 'react-modal';

import ErrorBoundary from '../components/ErrorBoundary';
import { LanguageProvider } from '../components/LanguageContext';
import { StatusLineProvider } from '../components/StatusLine';

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export default function App({
  Component,
  pageProps,
}: Readonly<AppProps>): JSX.Element {
  Modal.setAppElement('#__next');
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <StatusLineProvider>
          <Component {...pageProps} />
        </StatusLineProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
