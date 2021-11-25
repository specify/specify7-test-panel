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
  databases,
  branchesWithPullRequests,
  branchesWithoutPullRequests,
  dispatch,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly deployments: RA<DeploymentWithInfo>;
  readonly schemaVersions: IR<string>;
  readonly databases: IR<string>;
  readonly dispatch: (action: Actions) => void;
  readonly branchesWithPullRequests: RA<Readonly<[string, PullRequest]>>;
  readonly branchesWithoutPullRequests: RA<string>;
}): JSX.Element {
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
