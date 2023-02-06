import Head from 'next/head';
import React from 'react';

import { localization } from '../const/localization';
import FilterUsers from './FilterUsers';

const extractTitle = (title: string): string =>
  title === ''
    ? localization.pageTitle
    : title.endsWith(' ')
    ? `${title}- ${localization.pageTitle}`
    : title;

export default function Layout({
  title,
  children,
  protected: isProtected,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly protected: boolean | undefined;
}): JSX.Element {
  return (
    <>
      <Head>
        <title>{extractTitle(title)}</title>
        <link href="/favicon.ico" rel="icon" />
        <meta content="noindex,nofollow" name="robots" />
      </Head>
      <main className="flex h-screen w-full flex-col gap-10 overflow-auto p-8">
        {typeof isProtected === 'boolean' ? (
          <FilterUsers protected={isProtected}>{children}</FilterUsers>
        ) : (
          children
        )}
      </main>
    </>
  );
}
