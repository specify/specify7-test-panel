import React from 'react';
import { maxDeployments } from '../const/siteConfig';
import siteInfo from '../const/siteInfo';
import { PullRequest } from '../lib/github';
import {
  getMostCommonElement,
  getMostRecentTag,
  trimString,
} from '../lib/helpers';
import { Language } from '../lib/languages';
import { Deployment } from '../lib/deployment';
import { IR, RA } from '../lib/typescriptCommonTypes';
import { localizationStrings } from '../pages';
import { Actions, reducer } from '../reducers/Dashboard';
import Link from 'next/link';
import {
  disabledButtonClassName,
  extraButtonClassName,
  infoButtonClassName,
  link,
  successButtonClassName,
} from './InteractivePrimitives';

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
  readonly initialState: RA<Deployment>;
  readonly schemaVersions: IR<string>;
  readonly branches: IR<string>;
  readonly databases: RA<string>;
  readonly pullRequests: RA<PullRequest>;
  readonly onSave: (state: RA<Deployment>) => void;
}) {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'MainState',
    deployment: initialState,
  });

  const deploymentProps: Parameters<typeof Deployments>[0] = {
    languageStrings,
    deployments: state.deployment,
    schemaVersions,
    branches,
    databases,
    pullRequests,
    dispatch,
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
    JSON.stringify(initialState) !== JSON.stringify(state.deployment);

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
                  branch: getMostRecentTag(branches),
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
        <span className="flex-1" />
        {
          <button
            type="submit"
            form="dashboard"
            className={`${successButtonClassName} ${
              hasChanges ? '' : 'sr-only'
            }`}
            disabled={!hasChanges}
            onClick={() => handleSave(state.deployment)}
          >
            {languageStrings.saveChanges}
          </button>
        }
      </div>
    </>
  );
}

function Deployments({
  languageStrings,
  deployments,
  schemaVersions,
  branches,
  databases,
  pullRequests,
  dispatch,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly deployments: RA<Deployment>;
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
    <ul className="gap-y-5 flex flex-col mt-4 mb-8">
      {deployments.map((deployment, index) => (
        <li
          key={index}
          className="gap-x-5 flex flex-row p-4 bg-gray-300 rounded"
        >
          <a
            href={
              'hostname' in deployment
                ? `${document.location.protocol}//${deployment.hostname}.${document.location.hostname}/`
                : undefined
            }
            className={
              'hostname' in deployment
                ? infoButtonClassName
                : disabledButtonClassName
            }
            onClick={console.log}
          >
            {languageStrings.launch}
          </a>
          <select
            className="p-2 rounded-md"
            value={deployment.branch}
            required
            style={{ maxWidth: '20vw' }}
            onChange={({ target }) =>
              dispatch({
                type: 'ChangeConfigurationAction',
                id: index,
                newState: {
                  ...deployment,
                  branch: target.value,
                },
              })
            }
          >
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
          <div className="flex items-center">
            <p>
              {branchesWithoutPullRequests.includes(deployment.branch)
                ? languageStrings.serverName(index + 1)
                : [
                    branchesWithPullRequests.find(
                      ([branch]) => branch === deployment.branch
                    )![1],
                  ].map((pullRequest, index) => (
                    <JsxPullRequestFormatter
                      pullRequest={pullRequest}
                      key={index}
                    />
                  ))}
            </p>
          </div>
          <span className="flex-1" />
          {deployment.wasAutoDeployed && (
            <span className="flex items-center text-yellow-600">
              {languageStrings.automatic}
            </span>
          )}
          <select
            className="p-2 rounded-md"
            value={deployment.database}
            required
            style={{ maxWidth: '10vw' }}
            onChange={({ target }) =>
              dispatch({
                type: 'ChangeConfigurationAction',
                id: index,
                newState: {
                  ...deployment,
                  database: target.value,
                },
              })
            }
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
            style={{ maxWidth: '10vw' }}
            onChange={({ target }) =>
              dispatch({
                type: 'ChangeConfigurationAction',
                id: index,
                newState: {
                  ...deployment,
                  schemaVersion: target.value,
                },
              })
            }
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

const pullRequestFormatter = (pullRequest: PullRequest): string =>
  `#${pullRequest.number} ${pullRequest.title}`;

function JsxPullRequestFormatter({
  pullRequest,
}: {
  pullRequest: PullRequest;
}): JSX.Element {
  return (
    <>
      <a
        className={link}
        href={`https://github.com/specify/specify7/pull/${pullRequest.number}`}
      >
        {`#${pullRequest.number}`}
      </a>{' '}
      <span
        title={pullRequest.title.length > 55 ? pullRequest.title : undefined}
      >
        {trimString(pullRequest.title, 55)}
      </span>
      {Object.keys(pullRequest.closingIssuesReferences.nodes).length > 0 ? (
        <span>
          {` (`}
          {pullRequest.closingIssuesReferences.nodes.flatMap(
            ({ number, title }) =>
              [
                <a
                  className={link}
                  key={number}
                  title={title}
                  href={`https://github.com/specify/specify7/issues/${number}`}
                >
                  {`#${number}`}
                </a>,
                `, `,
              ].slice(0, -1)
          )}
          {`)`}
        </span>
      ) : undefined}
    </>
  );
}
