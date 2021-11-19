import React from 'react';
import { Dashboard } from '../components/Dashboard';
import FilterUsers from '../components/FilterUsers';

import Layout from '../components/Layout';
import { Loading, ModalDialog } from '../components/ModalDialog';
import { useApi, useAsync } from '../components/useApi';
import { getPullRequests } from '../lib/github';
import type { LocalizationStrings } from '../lib/languages';
import type { Deployment } from '../lib/deployment';
import { IR, RA } from '../lib/typescriptCommonTypes';
import { getUserInfo, getUserTokenCookie } from '../lib/user';

export const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly errorOccurred: string;
  readonly launch: string;
  readonly readyForTesting: string;
  readonly customDeployments: string;
  readonly automatic: string;
  readonly automaticDescription: string;
  readonly ready: string;
  readonly fetching: string;
  readonly starting: string;
  readonly collection: string;
  readonly discipline: string;
  readonly institution: string;
  readonly specifyVersion: string;
  readonly schemaVersion: string;
  readonly database: string;
  readonly databases: string;
  readonly saveChanges: string;
  readonly destroy: string;
  readonly addInstance: string;
  readonly otherBranches: string;
  readonly serverName: (index: number) => string;
  readonly uploadDatabasesFirst: string;
}> = {
  'en-US': {
    title: 'Dashboard',
    errorOccurred: 'Unexpected error occurred',
    launch: 'Launch',
    readyForTesting: 'Ready for Testing',
    customDeployments: 'Custom Deployments',
    automatic: 'Automatic',
    automaticDescription:
      'This instance was deployed automatically because it is ready for ' +
      'testing',
    ready: 'Ready',
    fetching: 'Fetching',
    starting: 'Starting',
    collection: 'Collection',
    discipline: 'Discipline',
    institution: 'Institution',
    specifyVersion: 'Specify Version',
    database: 'Database',
    databases: 'Databases',
    saveChanges: 'Save Changes',
    destroy: 'Destroy',
    addInstance: 'Add Instance',
    otherBranches: 'Other Branches:',
    serverName: (index) => `Server #${index}`,
    uploadDatabasesFirst: 'Upload database first',
    schemaVersion: 'Schema Version',
  },
};

export default function Index(): JSX.Element {
  const [state, setState] = useApi<RA<Deployment>>('/api/state');
  const branches = useApi<IR<string>>('/api/dockerhub/specify7-service')[0];
  const schemaVersions = useApi<IR<string>>(
    '/api/dockerhub/specify6-service'
  )[0];
  const databases = useApi<RA<string>>('/api/databases/')[0];
  const pullRequests = useAsync(async () =>
    getPullRequests(
      await getUserInfo(getUserTokenCookie(document.cookie ?? '') ?? '')
    )
  )[0];

  return (
    <Layout
      title={localizationStrings}
      localizationStrings={localizationStrings}
    >
      {(languageStrings, language): JSX.Element => (
        <FilterUsers protected>
          {typeof state === 'undefined' ||
          typeof schemaVersions === 'undefined' ||
          typeof branches === 'undefined' ||
          typeof databases === 'undefined' ||
          typeof pullRequests === 'undefined' ? (
            <Loading />
          ) : typeof state === 'string' ||
            typeof schemaVersions === 'string' ||
            typeof branches === 'string' ||
            typeof databases === 'string' ||
            typeof pullRequests === 'string' ? (
            <ModalDialog title={languageStrings['title']}>
              {[state, schemaVersions, branches, databases, pullRequests].find(
                (value) => typeof value === 'string'
              )}
            </ModalDialog>
          ) : (
            <Dashboard
              languageStrings={languageStrings}
              language={language}
              initialState={state.data.map((deployment, id) => ({
                ...deployment,
                frontend: { id },
              }))}
              schemaVersions={schemaVersions.data}
              branches={branches.data}
              databases={databases.data}
              pullRequests={pullRequests}
              onSave={async (newState) => {
                setState(undefined);
                fetch('/api/state', {
                  method: 'POST',
                  body: JSON.stringify(
                    newState.map(({ frontend: _, ...rest }) => rest)
                  ),
                })
                  .then(async (response) => {
                    const data = await response.json();
                    if (response.status === 200) setState(data);
                    else
                      setState(
                        data.error ?? data ?? 'Unexpected Error Occurred'
                      );
                  })
                  .catch(setState);
              }}
            />
          )}
        </FilterUsers>
      )}
    </Layout>
  );
}
