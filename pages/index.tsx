import React from 'react';
import { Dashboard } from '../components/Dashboard';

import FilterUsers from '../components/FilterUsers';
import Layout from '../components/Layout';
import { Loading, ModalDialog } from '../components/ModalDialog';
import { contentClassName } from '../components/UI';
import type { LocalizationStrings } from '../lib/languages';
import type { Deployment } from '../lib/deployment';
import { RA } from '../lib/typescriptCommonTypes';

export const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly errorOccurred: string;
  readonly launch: string;
  readonly readyForTesting: string;
  readonly customDeployments: string;
  readonly automatic: string;
  readonly databases: string;
  readonly saveChanges: string;
  readonly destroy: string;
  readonly addInstance: string;
}> = {
  'en-US': {
    title: 'Dashboard',
    errorOccurred: 'Unexpected error occurred',
    launch: 'Launch',
    readyForTesting: 'Ready for Testing',
    customDeployments: 'Custom Deployments',
    automatic: 'Automatic',
    databases: 'Databases',
    saveChanges: 'Save Changes',
    destroy: 'Destroy',
    addInstance: 'Add Instance',
  },
};

export default function Index(): JSX.Element {
  const [state, setState] = React.useState<undefined | string | RA<Deployment>>(
    undefined
  );

  React.useEffect(() => {
    fetch('/api/state')
      .then(async (response) => {
        const state = await response.json();
        if (response.status === 200) setState(state);
        else setState(state.error);
      })
      .catch((error) => {
        console.error(error);
        setState(error.toString());
      });
  }, []);

  return (
    <Layout
      title={localizationStrings}
      localizationStrings={localizationStrings}
    >
      {(languageStrings, language): JSX.Element => (
        <FilterUsers protected>
          {(): JSX.Element => (
            <main className={`${contentClassName} flex flex-col`}>
              {typeof state === 'undefined' ? (
                <Loading />
              ) : typeof state === 'string' ? (
                <ModalDialog title={languageStrings['title']}>
                  {state}
                </ModalDialog>
              ) : (
                <Dashboard
                  languageStrings={languageStrings}
                  language={language}
                  initialState={state}
                />
              )}
            </main>
          )}
        </FilterUsers>
      )}
    </Layout>
  );
}
