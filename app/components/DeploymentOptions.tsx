import React from 'react';

import type { Deployment } from '../lib/deployment';
import type { Language } from '../lib/languages';
import type { localizationStrings } from '../pages';
import { icons } from './Icons';
import {
  dangerButtonClassName,
  disabledButtonClassName,
  infoButtonClassName,
} from './InteractivePrimitives';
import { ModalDialog } from './ModalDialog';
import { DateElement } from './DateElement';

export function DeploymentOptions({
  deployment,
  languageStrings,
  onDelete: handleDelete,
}: {
  readonly deployment: Deployment;
  readonly languageStrings: typeof localizationStrings[Language];
  readonly onDelete: () => void;
}): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDisabled = deployment.deployedAt === undefined;
  return (
    <>
      <button
        className={isDisabled ? disabledButtonClassName : infoButtonClassName}
        disabled={isDisabled}
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
            >
              {languageStrings.remove}
            </button>
            <button
              className={infoButtonClassName}
              type="button"
              onClick={(): void => setIsOpen(false)}
            >
              {languageStrings.close}
            </button>
          </>
        }
        isOpen={isOpen}
        title={deployment.hostname ?? languageStrings.newDeployment}
        onClose={(): void => setIsOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            {languageStrings.lastAccessed}
            <div className="rounded-md border bg-gray-200 p-1.5">
              <DateElement date={deployment.accessedAt} />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            {languageStrings.deployedAt}
            <div className="rounded-md border bg-gray-200 p-1.5">
              <DateElement date={deployment.deployedAt} />
            </div>
          </label>
        </div>
      </ModalDialog>
    </>
  );
}
