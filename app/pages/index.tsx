import React from 'react';

import { Dashboard } from '../components/Dashboard';
import FilterUsers from '../components/FilterUsers';
import Layout from '../components/Layout';
import { Loading, ModalDialog } from '../components/ModalDialog';
import { useApi, useAsync } from '../components/useApi';
import { stateRefreshInterval } from '../const/siteConfig';
import type { Deployment } from '../lib/deployment';
import { getPullRequests } from '../lib/github';
import type { Language, LocalizationStrings } from '../lib/languages';
import type { IR, RA } from '../lib/typescriptCommonTypes';
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
  readonly corruptDatabase: string;
  readonly lastAccessed: string;
  readonly notes: string;
  readonly newDeployment: string;
  readonly close: string;
  readonly remove: string;
  readonly deployedAt: string;
  readonly buildDate: string;
  readonly loading: string;
  readonly frozenDeploymentDescription: string;
  readonly groupName: string;
  readonly never: string;
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
    corruptDatabase: 'corrupt database',
    lastAccessed: 'Last accessed',
    notes: 'Notes',
    newDeployment: 'New Deployment',
    close: 'Close',
    remove: 'Remove',
    deployedAt: 'Deployed at',
    buildDate: 'Build Date',
    loading: 'Loading...',
    frozenDeploymentDescription:
      'This deployment is frozen to prevent accidental changes.\n' +
      'You can unfreeze it by clearing the deployment notes field',
    groupName: 'Group Name',
    never: 'never',
  },
};

export default function Index(): JSX.Element {
  return (
    <Layout
      localizationStrings={localizationStrings}
      title={localizationStrings}
    >
      {(languageStrings, language): JSX.Element => (
        <FilterUsers protected>
          <Wrapper language={language} languageStrings={languageStrings} />
        </FilterUsers>
      )}
    </Layout>
  );
}

function Wrapper({
  languageStrings,
  language,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly language: Language;
}): JSX.Element {
  const [state, setState] = useApi<RA<Deployment>>('/api/state');
  const branches = useApi<IR<string>>('/api/dockerhub/specify7-service')[0];
  const schemaVersions = useApi<IR<string>>(
    '/api/dockerhub/specify6-service'
  )[0];
  const databases = useApi<IR<string | null>>('/api/databases')[0];
  const pullRequests = useAsync(
    React.useCallback(
      async () =>
        getPullRequests(
          await getUserInfo(getUserTokenCookie(document.cookie ?? '') ?? '')
        ),
      []
    )
  )[0];

  // Check periodically if deployment configuration has changed
  React.useEffect(() => {
    if (typeof state !== 'object') return;
    const fetchStatus = () => {
      if (destructorCalled || typeof state !== 'object') return;
      setTimeout(
        async () =>
          fetch('/api/state')
            .then<{ readonly data: RA<Deployment> }>(async (response) =>
              response.json()
            )
            .then(({ data }) => {
              if (destructorCalled || typeof state !== 'object') return;

              /*
               * Remove deployedAt, accessedAt and wasAutoDeployed when
               * comparing the states
               */
              const oldState = JSON.stringify(
                state.data.map(
                  ({ deployedAt, accessedAt, wasAutoDeployed, ...rest }) => rest
                )
              );
              const newState = JSON.stringify(
                data.map(
                  ({ deployedAt, accessedAt, wasAutoDeployed, ...rest }) => rest
                )
              );

              if (oldState !== newState) {
                // Force re-render layout from scratch
                setState('loading');
                setTimeout(() => setState({ data }), 0);
              }
              fetchStatus();
            })
            .catch(console.error),
        stateRefreshInterval
      );
    };

    let destructorCalled = false;
    fetchStatus();
    return () => {
      destructorCalled = true;
    };
  }, [state]);
  return typeof state === 'undefined' ||
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
    <ModalDialog title={languageStrings.title}>
      {[state, schemaVersions, branches, databases, pullRequests].find(
        (value): value is string => typeof value === 'string'
      )}
    </ModalDialog>
  ) : (
    <Dashboard
      branches={branches.data}
      databases={databases.data}
      initialState={state.data.map((deployment, id) => ({
        ...deployment,
        frontend: { id },
      }))}
      language={language}
      languageStrings={languageStrings}
      pullRequests={pullRequests}
      schemaVersions={schemaVersions.data}
      onSave={(newState): void => {
        setState(undefined);
        fetch('/api/state', {
          method: 'POST',
          body: JSON.stringify(
            newState.map(({ frontend: _, ...rest }) => rest)
          ),
        })
          .then(async (response) => {
            const textResponse = await response.text();
            try {
              const jsonResponse = JSON.parse(textResponse);
              if (response.status === 200) setState(jsonResponse);
              else
                setState(
                  jsonResponse.error ??
                    jsonResponse ??
                    'Unexpected Error Occurred'
                );
            } catch {
              setState(textResponse);
            }
          })
          .catch((error) => setState(error.toString()));
      }}
    />
  );
}
