import Link from 'next/link';
import React from 'react';

import type { DeploymentWithInfo } from '../lib/deployment';
import type { PullRequest } from '../lib/github';
import { getMostCommonElement, getMostRecentTag, group } from '../lib/helpers';
import type { IR, RA } from '../lib/typescriptCommonTypes';
import type { Database } from '../pages';
import { reducer } from '../reducers/Dashboard';
import { Deployments } from './Deployments';
import {
  extraButtonClassName,
  successButtonClassName,
} from './InteractivePrimitives';
import { filterArray } from '../lib/typescriptCommonTypes';
import { localization } from '../const/localization';

export function Dashboard({
  initialState,
  schemaVersions,
  branches,
  databases,
  pullRequests,
  onSave: handleSave,
}: {
  readonly initialState: RA<DeploymentWithInfo>;
  readonly schemaVersions: IR<string>;
  readonly branches: IR<string>;
  readonly databases: RA<Database>;
  readonly pullRequests: RA<PullRequest>;
  readonly onSave: (state: RA<DeploymentWithInfo>) => void;
}) {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'MainState',
    deployment: initialState,
  });

  const pairedBranches = Object.entries(branches).map(
    ([branch, modifiedDate]) => ({
      branch,
      modifiedDate: new Date(modifiedDate),
      pullRequest: pullRequests.find(
        ({ headRefName }) => headRefName === branch
      ),
    })
  );

  const branchesWithoutPullRequests = filterArray(
    pairedBranches.map(({ branch, pullRequest }) =>
      pullRequest === undefined ? undefined : branch
    )
  );

  const databaseGroups = React.useMemo(
    () =>
      Object.fromEntries(
        group(
          group(
            filterArray(
              state.deployment.map(({ group, database }) =>
                group === undefined || group.length === 0
                  ? undefined
                  : [database, group]
              )
            )
          ).map(([database, groups]) => [groups.join(', '), database])
        )
      ),
    [state.deployment]
  );

  const deploymentProps: Parameters<typeof Deployments>[0] = {
    deployments: state.deployment,
    schemaVersions,
    databases,
    dispatch,
    branches: pairedBranches,
    databaseGroups,
  };

  const readyForTesting = {
    ...deploymentProps,
    deployments: state.deployment.filter(({ branch }) =>
      branchesWithoutPullRequests.includes(branch)
    ),
  };

  const customDeployments = {
    ...deploymentProps,
    deployments: state.deployment.filter(
      ({ branch }) => !branchesWithoutPullRequests.includes(branch)
    ),
  };

  const hasChanges =
    JSON.stringify(initialState) !== JSON.stringify(state.deployment);

  return (
    <div className="flex h-screen w-full flex-col gap-10 overflow-hidden">
      <div className="flex flex-1 flex-col gap-5 overflow-hidden">
        <h1 className="text-5xl">{localization.pageTitle}</h1>
        <form
          id="dashboard"
          className="flex-1 overflow-y-auto"
          onSubmit={(event): void => {
            event.preventDefault();
            handleSave(state.deployment);
          }}
        >
          {readyForTesting.deployments.length > 0 && (
            <>
              <h2 className="text-2xl">{localization.readyForTesting}</h2>
              <Deployments {...readyForTesting} />
            </>
          )}
          {customDeployments.deployments.length > 0 && (
            <>
              <h2 className="mt-8 text-2xl">
                {localization.customDeployments}
              </h2>
              <Deployments {...customDeployments} />
            </>
          )}
        </form>
      </div>
      <div className="flex gap-2">
        <Link href="/databases/" className={extraButtonClassName}>
          {localization.databases}
        </Link>
        <button
          className={`${successButtonClassName} ${
            databases.length === 0
              ? 'cursor-not-allowed bg-green-900 hover:bg-green-900'
              : ''
          }`}
          disabled={databases.length === 0}
          title={
            databases.length === 0
              ? localization.uploadDatabasesFirst
              : undefined
          }
          type="button"
          onClick={(): void =>
            dispatch({
              type: 'AddInstanceAction',
              deployment: {
                branch: getMostRecentTag(branches),
                notes: '',
                database:
                  getMostCommonElement(
                    state.deployment.map(({ database }) => database)
                  ) ?? '',
                schemaVersion: getMostRecentTag(schemaVersions),
                wasAutoDeployed: false,
                frontend: {
                  id: state.deployment.length,
                },
              },
            })
          }
        >
          {localization.addInstance}
        </button>
        <span className="flex-1" />
        <input
          className={`${successButtonClassName} ${hasChanges ? '' : 'sr-only'}`}
          disabled={!hasChanges}
          form="dashboard"
          type="submit"
          value={localization.saveChanges}
        />
      </div>
    </div>
  );
}
