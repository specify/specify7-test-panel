import React from 'react';
import { maxDeployments } from '../const/siteConfig';
import siteInfo from '../const/siteInfo';
import { PullRequest } from '../lib/github';
import { getMostCommonElement, getMostRecentTag } from '../lib/helpers';
import { Language } from '../lib/languages';
import { DeploymentWithInfo } from '../lib/deployment';
import { IR, RA } from '../lib/typescriptCommonTypes';
import { localizationStrings } from '../pages';
import { reducer } from '../reducers/Dashboard';
import Link from 'next/link';
import { Deployments } from './Deployments';
import {
  extraButtonClassName,
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
  readonly initialState: RA<DeploymentWithInfo>;
  readonly schemaVersions: IR<string>;
  readonly branches: IR<string>;
  readonly databases: RA<string>;
  readonly pullRequests: RA<PullRequest>;
  readonly onSave: (state: RA<DeploymentWithInfo>) => void;
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
              <h2 className="mt-8 text-2xl">
                {languageStrings.customDeployments}
              </h2>
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
            className={`${successButtonClassName} ${
              databases.length === 0
                ? 'bg-green-900 cursor-not-allowed hover:bg-green-900'
                : ''
            }`}
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
                  frontend: {
                    id: state.deployment.length,
                  },
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