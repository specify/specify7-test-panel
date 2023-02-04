import React from 'react';

import { Dashboard } from '../components/Dashboard';
import FilterUsers from '../components/FilterUsers';
import Layout from '../components/Layout';
import { Loading, ModalDialog } from '../components/ModalDialog';
import { useApi, useAsync } from '../components/useApi';
import { stateRefreshInterval } from '../const/siteConfig';
import type { Deployment } from '../lib/deployment';
import { getPullRequests } from '../lib/github';
import type { IR, RA } from '../lib/typescriptCommonTypes';
import { getUserInfo, getUserTokenCookie } from '../lib/user';
import { localization } from '../const/localization';

export default function Index(): JSX.Element {
  return (
    <Layout title={localization.pageTitle}>
      <FilterUsers protected>
        <Wrapper />
      </FilterUsers>
    </Layout>
  );
}

export type Database = {
  readonly name: string;
  readonly version: string | null;
};

export function useDatabases(): undefined | string | RA<Database> {
  const databases = useApi<IR<string | null>>('/api/databases')[0];
  return React.useMemo(
    () =>
      typeof databases === 'object'
        ? Object.entries(databases.data)
            .sort(([leftName], [rightName]) =>
              leftName.toLowerCase().localeCompare(rightName.toLowerCase())
            )
            .map(([name, version]) => ({ name, version }))
        : databases,
    [databases]
  );
}

function Wrapper(): JSX.Element {
  const [state, setState] = useApi<RA<Deployment>>('/api/state');
  const branches = useApi<IR<string>>('/api/dockerhub/specify7-service')[0];
  const schemaVersions = useApi<IR<string>>(
    '/api/dockerhub/specify6-service'
  )[0];

  const databases = useDatabases();

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
    <ModalDialog title={localization.dashboard}>
      {[state, schemaVersions, branches, databases, pullRequests].find(
        (value): value is string => typeof value === 'string'
      )}
    </ModalDialog>
  ) : (
    <Dashboard
      branches={branches.data}
      databases={databases}
      initialState={state.data.map((deployment, id) => ({
        ...deployment,
        frontend: { id },
      }))}
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
