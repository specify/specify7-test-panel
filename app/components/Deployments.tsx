import React from 'react';

import type { DeploymentWithInfo } from '../lib/deployment';
import type { PullRequest } from '../lib/github';
import type { Language } from '../lib/languages';
import type { IR, RA } from '../lib/typescriptCommonTypes';
import type { Database, localizationStrings } from '../pages';
import type { Actions } from '../reducers/Dashboard';
import { DeploymentLine } from './Deployment';
import { group, multiSortFunction } from '../lib/helpers';

export type Branch = {
  readonly branch: string;
  readonly modifiedDate: Date;
  readonly pullRequest: PullRequest | undefined;
};

const versionPrefix = 'v7';
export function isStale(date: Date): boolean {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return date < monthAgo;
}

function useSortedBranches(branches: RA<Branch>): RA<Branch> {
  return React.useMemo(
    () =>
      Array.from(branches)
        // Latest is an unpredictable branch, thus will exclude it
        .filter(({ branch }) => branch !== 'latest')
        .sort(
          multiSortFunction(
            ({ pullRequest }) => typeof pullRequest === 'object',
            true,
            ({ branch }) => branch === 'edge',
            true,
            ({ branch }) => branch.startsWith(versionPrefix),
            true
          )
        ),
    [branches]
  );
}

export function Deployments({
  languageStrings,
  deployments,
  schemaVersions,
  databases,
  branches: rawBranches,
  dispatch,
  databaseGroups,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly deployments: RA<DeploymentWithInfo>;
  readonly schemaVersions: IR<string>;
  readonly databases: RA<Database>;
  readonly dispatch: (action: Actions) => void;
  readonly branches: RA<Branch>;
  readonly databaseGroups: IR<RA<string>>;
}): JSX.Element {
  const branches = useSortedBranches(rawBranches);

  const grouped = Array.from(
    group(deployments.map((deployment) => [deployment.group ?? '', deployment]))
  ).sort(([leftGroup], [rightGroup]) => leftGroup.localeCompare(rightGroup));
  return (
    <ul className="mt-4 flex flex-col gap-y-5">
      {grouped.map(([group, deployments], index) => (
        <li key={index}>
          {group}
          <ul className="mt-4 flex flex-col gap-y-5">
            {deployments.map((deployment) => (
              <DeploymentLine
                branches={branches}
                databases={databases}
                deployment={deployment}
                dispatch={dispatch}
                key={deployment.frontend.id}
                languageStrings={languageStrings}
                schemaVersions={schemaVersions}
                databaseGroups={databaseGroups}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
