import React from 'react';
import { PullRequest } from '../lib/github';
import { Language } from '../lib/languages';
import { DeploymentWithInfo } from '../lib/deployment';
import { IR, RA } from '../lib/typescriptCommonTypes';
import { localizationStrings } from '../pages';
import { Actions } from '../reducers/Dashboard';
import { DeploymentLine } from './Deployment';

export function Deployments({
  languageStrings,
  deployments,
  schemaVersions,
  branches,
  databases,
  pullRequests,
  dispatch,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly deployments: RA<DeploymentWithInfo>;
  readonly schemaVersions: IR<string>;
  readonly branches: IR<string>;
  readonly databases: RA<string>;
  readonly pullRequests: RA<PullRequest>;
  readonly dispatch: (action: Actions) => void;
}): JSX.Element {
  const pairedBranches = Object.keys(branches).map(
    (branch) =>
      [
        branch,
        pullRequests.find(({ headRefName }) => headRefName === branch),
      ] as const
  );

  const branchesWithPullRequests = pairedBranches.filter(
    (entry): entry is [string, PullRequest] => typeof entry[1] !== 'undefined'
  );
  const branchesWithoutPullRequests = pairedBranches
    .filter(
      (entry): entry is [string, PullRequest] => typeof entry[1] === 'undefined'
    )
    .map(([branch]) => branch);

  return (
    <ul className="gap-y-5 flex flex-col mt-4">
      {deployments.map((deployment) => (
        <DeploymentLine
          key={deployment.frontend.id}
          deployment={deployment}
          languageStrings={languageStrings}
          schemaVersions={schemaVersions}
          databases={databases}
          dispatch={dispatch}
          branchesWithPullRequests={branchesWithPullRequests}
          branchesWithoutPullRequests={branchesWithoutPullRequests}
        />
      ))}
    </ul>
  );
}
