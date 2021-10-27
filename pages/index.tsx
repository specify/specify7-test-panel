import React from 'react';

import FilterUsers from '../components/FilterUsers';
import Layout from '../components/Layout';
import { contentClassName } from '../components/UI';
import type { LocalizationStrings } from '../lib/languages';

const localizationStrings: LocalizationStrings<{
  readonly title: string;
}> = {
  'en-US': {
    title: 'Dashboard',
  },
};

export default function Dashboard(): JSX.Element {
  return (
    <Layout
      title={localizationStrings}
      localizationStrings={localizationStrings}
    >
      {(): JSX.Element => (
        <FilterUsers protected>
          {(): JSX.Element => <div className={contentClassName} />}
        </FilterUsers>
      )}
    </Layout>
  );
}
