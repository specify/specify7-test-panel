import React from 'react';
import { maxDeployments } from '../const/siteConfig';
import siteInfo from '../const/siteInfo';
import { Language } from '../lib/languages';
import { Deployment } from '../lib/deployment';
import { RA } from '../lib/typescriptCommonTypes';
import { localizationStrings } from '../pages';
import { reducer } from '../reducers/Dashboard';
import Link from 'next/link';
import {
  extraButtonClassName,
  successButtonClassName,
} from './InteractivePrimitives';

export function Dashboard({
  languageStrings,
  language,
  initialState,
}: {
  readonly languageStrings: typeof localizationStrings[Language];
  readonly language: Language;
  readonly initialState: RA<Deployment>;
}) {
  const [state, _dispatch] = React.useReducer(reducer, {
    type: 'MainState',
    deployment: initialState,
  });

  return (
    <>
      <div className="flex flex-col flex-1 gap-5">
        <h1 className="text-5xl">{siteInfo[language].title}</h1>
        <h2 className="text-2xl">{languageStrings.readyForTesting}</h2>
        <ul className="">
          {state.deployment.map((deployment, index) => (
            <li key={index}>
              <div>
                <a href="#" className="" onClick={console.log}>
                  {languageStrings.launch}
                </a>
                <select value={deployment.branch} />
                <p>Pull Request / Server index</p>
              </div>
              <div>
                {deployment.wasAutoDeployed && languageStrings.automatic}
                <select value={deployment.database} />
                <select value={deployment.schemaVersion} />
              </div>
            </li>
          ))}
        </ul>
        <h2 className="text-2xl">{languageStrings.customDeployments}</h2>
      </div>
      <div className="flex gap-2">
        <Link href="/databases/">
          <a className={extraButtonClassName}>{languageStrings.databases}</a>
        </Link>
        <span className="flex-1" />
        {JSON.stringify(initialState) !== JSON.stringify(state.deployment) && (
          <button type="button" className={successButtonClassName}>
            {languageStrings.saveChanges}
          </button>
        )}
        {state.deployment.length < maxDeployments && (
          <button type="button" className={successButtonClassName}>
            {languageStrings.addInstance}
          </button>
        )}
      </div>
    </>
  );
}
