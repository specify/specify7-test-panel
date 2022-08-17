import React from 'react';

import type { Deployment } from '../lib/deployment';
import type { Language } from '../lib/languages';
import type { localizationStrings } from '../pages';
import { DateElement } from './DateElement';
import { icons } from './Icons';
import {
  dangerButtonClassName,
  infoButtonClassName,
} from './InteractivePrimitives';
import { ModalDialog } from './ModalDialog';
import { useApi } from './useApi';
import { isNoFetchMode } from '../lib/helpers';

export function DeploymentOptions({
  deployment,
  languageStrings,
  onChange: handleChange,
  onDelete: handleDelete,
}: {
  readonly deployment: Deployment;
  readonly languageStrings: typeof localizationStrings[Language];
  readonly onChange: (deployment: Partial<Deployment>) => void;
  readonly onDelete: () => void;
}): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);

  const isFrozen = deployment.notes.length > 0;
  const frozenDescription = isFrozen
    ? languageStrings.frozenDeploymentDescription
    : undefined;

  const [group, setGroup] = React.useState<string | undefined>(
    deployment.group
  );

  function handleClose(): void {
    setIsOpen(false);
    if (group !== deployment.group) handleChange({ group });
  }

  return (
    <>
      <button
        className={infoButtonClassName}
        type="button"
        onClick={(): void => setIsOpen(true)}
      >
        {icons.cog}
      </button>
      <ModalDialog
        buttons={
          <>
            <button
              className={dangerButtonClassName}
              type="button"
              onClick={handleDelete}
              disabled={isFrozen}
              title={frozenDescription}
            >
              {languageStrings.remove}
            </button>
            <button
              className={infoButtonClassName}
              type="button"
              onClick={handleClose}
            >
              {languageStrings.close}
            </button>
          </>
        }
        isOpen={isOpen}
        title={deployment.hostname ?? languageStrings.newDeployment}
        onClose={handleClose}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            {languageStrings.lastAccessed}
            <div className="rounded-md border bg-gray-200 p-1.5">
              <DateElement
                date={deployment.accessedAt}
                fallback={languageStrings.never}
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            {languageStrings.deployedAt}
            <div className="rounded-md border bg-gray-200 p-1.5">
              <DateElement
                date={deployment.deployedAt}
                fallback={languageStrings.never}
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            {languageStrings.groupName}
            <input
              type="text"
              className="rounded-md border bg-gray-200 p-1.5"
              value={group ?? ''}
              onChange={({ target }): void => setGroup(target.value)}
            />
          </label>
        </div>
        {typeof deployment.hostname === 'string' && !isNoFetchMode() && (
          <DeploymentBuildDate
            hostname={deployment.hostname}
            languageStrings={languageStrings}
          />
        )}
      </ModalDialog>
    </>
  );
}

function DeploymentBuildDate({
  hostname,
  languageStrings,
}: {
  readonly hostname: string;
  readonly languageStrings: typeof localizationStrings[Language];
}): JSX.Element | null {
  const [state] = useApi<string>(
    `${document.location.protocol}//${hostname}.${document.location.hostname}/static/build_date.txt`
  );
  return typeof state === 'object' ? (
    <label className="flex flex-col gap-2">
      {languageStrings.buildDate}
      <div className="rounded-md border bg-gray-200 p-1.5">
        <DateElement date={state.data} fallback={languageStrings.loading} />
      </div>
    </label>
  ) : null;
}
