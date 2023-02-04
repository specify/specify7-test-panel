import Link from 'next/link';
import React from 'react';

import Layout from '../components/Layout';
import { Centered } from './UI';
import { localization } from '../const/localization';

export default function ErrorPage({
  errorCode,
}: {
  readonly errorCode: number;
}): JSX.Element {
  return (
    <Layout title={errorCode.toString()}>
      <Centered>
        <div className="text-center">
          <h1 className="py-2 text-9xl text-indigo-300">{errorCode}</h1>
          <h2>{localization.notFoundHeader}</h2>
          <p>
            {localization.notFoundDescription}
            <Link
              href="/"
              className="block pt-10 text-red-400 transition hover:text-black"
            >
              {localization.returnToHomePage}
            </Link>
          </p>
        </div>
      </Centered>
    </Layout>
  );
}
