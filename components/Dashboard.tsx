import { language } from '@hapi/accept';
import React from 'react';
import { maxDeployments } from '../const/siteConfig';
import siteInfo from '../const/siteInfo';
import { PullRequest, pullRequestFormatter } from '../lib/github';
import { getMostCommonElement, getMostRecentTag } from '../lib/helpers';
import { Language } from '../lib/languages';
import { Deployment } from '../lib/deployment';
import { IR, RA } from '../lib/typescriptCommonTypes';
import { localizationStrings } from '../pages';
import { reducer } from '../reducers/Dashboard';
import Link from 'next/link';
import {
  extraButtonClassName,
  infoButtonClassName,
  primaryButtonClassName,
  successButtonClassName,
} from './InteractivePrimitives';

export function Dashboard({
  languageStrings,
  language,
  initialState,
  schemaVersions,
  specifyVersions,
  databases,
  pullRequests,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly language: Language;
  readonly initialState: RA<Deployment>;
  readonly schemaVersions: IR<string>;
  readonly specifyVersions: IR<string>;
  readonly databases: RA<string>;
  readonly pullRequests: RA<PullRequest>;
}) {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'MainState',
    deployment: initialState,
  });

  const deploymentProps: Parameters<typeof Deployments>[0] = {
    languageStrings,
    deployments: state.deployment,
    schemaVersions,
    specifyVersions,
    databases,
    pullRequests,
  };

  const automaticDeploymentProps = {
    ...deploymentProps,
    deployments: state.deployment.filter(
      ({ wasAutoDeployed }) => wasAutoDeployed
    ),
  };

  const customDeploymentProps = {
    ...deploymentProps,
    deployments: state.deployment.filter(
      ({ wasAutoDeployed }) => !wasAutoDeployed
    ),
  };

  const hasChanges =
    JSON.stringify(state.deployment) !== JSON.stringify(state.deployment);

  return (
    <>
      <div className="flex flex-col flex-1 gap-5">
        <h1 className="text-5xl">{siteInfo[language].title}</h1>
        <form id="dashboard">
          {automaticDeploymentProps.deployments.length > 0 && (
            <>
              <h2 className="text-2xl">{languageStrings.readyForTesting}</h2>
              <Deployments {...automaticDeploymentProps} />
            </>
          )}
          {customDeploymentProps.deployments.length > 0 && (
            <>
              <h2 className="text-2xl">{languageStrings.customDeployments}</h2>
              <Deployments {...customDeploymentProps} />
            </>
          )}
        </form>
      </div>
      <div className="flex gap-2">
        <Link href="/databases/">
          <a className={extraButtonClassName}>{languageStrings.databases}</a>
        </Link>
        <span className="flex-1" />
        {
          <button
            type="submit"
            form="dashboard"
            className={`${successButtonClassName} ${
              hasChanges ? '' : 'sr-only'
            }`}
            disabled={!hasChanges}
          >
            {languageStrings.saveChanges}
          </button>
        }
        {state.deployment.length < maxDeployments && (
          <button
            type="button"
            className={successButtonClassName}
            disabled={databases.length === 0}
            title={
              databases.length === 0
                ? languageStrings.uploadDatabasesFirst
                : undefined
            }
            onClick={() =>
              dispatch({
                type: 'AddInstanceAction',
                deployment: {
                  branch: getMostRecentTag(specifyVersions),
                  database: getMostCommonElement(databases) ?? '',
                  schemaVersion: getMostRecentTag(schemaVersions),
                  wasAutoDeployed: false,
                },
              })
            }
          >
            {languageStrings.addInstance}
          </button>
        )}
      </div>
    </>
  );
}

function Deployments({
  languageStrings,
  deployments,
  schemaVersions,
  specifyVersions,
  databases,
  pullRequests,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly deployments: RA<Deployment>;
  readonly schemaVersions: IR<string>;
  readonly specifyVersions: IR<string>;
  readonly databases: RA<string>;
  readonly pullRequests: RA<PullRequest>;
}): JSX.Element {
  const branches = Object.keys(specifyVersions).map(
    (branch) =>
      [
        branch,
        pullRequests.find(({ headRefName }) => headRefName === branch),
      ] as const
  );

  const branchesWithPullRequests = branches.filter(
    (entry): entry is [string, PullRequest] => typeof entry[1] !== 'undefined'
  );
  const branchesWithoutPullRequests = branches
    .filter(
      (entry): entry is [string, PullRequest] => typeof entry[1] === 'undefined'
    )
    .map(([branch]) => branch);

  return (
    <ul className="gap-y-5 flex flex-col mt-4 mb-8">
      {deployments.map((deployment, index) => (
        <li
          key={index}
          className="gap-x-5 flex flex-row p-4 bg-gray-400 rounded"
        >
          <a href="#" className={infoButtonClassName} onClick={console.log}>
            {languageStrings.launch}
          </a>
          <select className="p-2 rounded-md" value={deployment.branch} required>
            {branchesWithPullRequests.map(([branch, pullRequest]) => (
              <optgroup key={branch} label={pullRequestFormatter(pullRequest)}>
                <option value={branch}>{branch}</option>
              </optgroup>
            ))}
            <optgroup label={languageStrings.branchesWithoutPullRequest}>
              {branchesWithoutPullRequests.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="flex items-center">
            {branchesWithoutPullRequests.includes(deployment.branch)
              ? languageStrings.serverName(index)
              : [
                  branchesWithPullRequests.find(
                    ([branch]) => branch === deployment.branch
                  )![1],
                ].map(pullRequestFormatter)}
          </p>
          <span className="flex-1" />
          <span>{deployment.wasAutoDeployed && languageStrings.automatic}</span>
          <select
            className="p-2 rounded-md"
            value={deployment.database}
            required
          >
            <optgroup label={languageStrings.databases}>
              {databases.map((database) => (
                <option key={database} value={database}>
                  {database}
                </option>
              ))}
            </optgroup>
          </select>
          <select
            className="p-2 rounded-md"
            value={deployment.schemaVersion}
            required
          >
            <optgroup label={languageStrings.schemaVersion}>
              {Object.keys(schemaVersions).map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </optgroup>
          </select>
        </li>
      ))}
    </ul>
  );
}
