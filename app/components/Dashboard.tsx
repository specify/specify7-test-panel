import Link from 'next/link';
import React from 'react';

import siteInfo from '../const/siteInfo';
import type { DeploymentWithInfo } from '../lib/deployment';
import type { PullRequest } from '../lib/github';
import { getMostCommonElement, getMostRecentTag } from '../lib/helpers';
import type { Language } from '../lib/languages';
import type { IR, RA } from '../lib/typescriptCommonTypes';
import type { Database, localizationStrings } from '../pages';
import { reducer } from '../reducers/Dashboard';
import { Deployments } from './Deployments';
import {
  extraButtonClassName,
  successButtonClassName,
} from './InteractivePrimitives';
import { filterArray } from '../lib/typescriptCommonTypes';

export function Dashboard({
  languageStrings,
  language,
  initialState,
  schemaVersions,
  branches,
  databases,
  pullRequests,
  onSave: handleSave,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly language: Language;
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

  const deploymentProps: Parameters<typeof Deployments>[0] = {
    languageStrings,
    deployments: state.deployment,
    schemaVersions,
    databases,
    dispatch,
    branches: pairedBranches,
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
        <h1 className="text-5xl">{siteInfo[language].title}</h1>
        <form id="dashboard" className="flex-1 overflow-y-auto">
          {readyForTesting.deployments.length > 0 && (
            <>
              <h2 className="text-2xl">{languageStrings.readyForTesting}</h2>
              <Deployments {...readyForTesting} />
            </>
          )}
          {customDeployments.deployments.length > 0 && (
            <>
              <h2 className="mt-8 text-2xl">
                {languageStrings.customDeployments}
              </h2>
              <Deployments {...customDeployments} />
            </>
          )}
        </form>
      </div>
      <div className="flex gap-2">
        <Link href="/databases/">
          <a className={extraButtonClassName}>{languageStrings.databases}</a>
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
              ? languageStrings.uploadDatabasesFirst
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
          {languageStrings.addInstance}
        </button>
        <span className="flex-1" />
        <button
          className={`${successButtonClassName} ${hasChanges ? '' : 'sr-only'}`}
          disabled={!hasChanges}
          form="dashboard"
          type="submit"
          onClick={() => handleSave(state.deployment)}
        >
          {languageStrings.saveChanges}
        </button>
      </div>
    </div>
  );
}
