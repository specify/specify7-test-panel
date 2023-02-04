import Head from 'next/head';
import React from 'react';

import { localization } from '../const/localization';

const extractTitle = (title: string): string =>
  title === ''
    ? localization.pageTitle
    : title.endsWith(' ')
    ? `${title}- ${localization.pageTitle}`
    : title;

export default function Layout({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <>
      <Head>
        <title>{extractTitle(title)}</title>
        <link href="/favicon.ico" rel="icon" />
        <meta content="noindex,nofollow" name="robots" />
      </Head>
      <main className="flex h-screen w-full flex-col gap-10 overflow-auto p-8">
        {children}
      </main>
    </>
  );
}
