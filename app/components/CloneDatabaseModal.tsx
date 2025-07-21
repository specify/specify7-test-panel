import React from 'react';
import { ModalDialog } from './ModalDialog';
import { successButtonClassName, primaryButtonClassName } from './InteractivePrimitives';
import { localization } from '../const/localization';

export function CloneDatabaseModal({
  database,
  onClose: handleClose,
}: {
  readonly database: string;
  readonly onClose: () => void;
}): JSX.Element {
  const [prefix, setPrefix] = React.useState('');
  const [isCloning, setIsCloning] = React.useState(false);

  const handleClone = async (): Promise<void> => {
    if (!prefix.trim()) {
      alert(localization.enterPrefix);
      return;
    }
    setIsCloning(true);
    const newDbName = `${prefix.trim()}_${database}`;
    try {
      const response = await fetch(`/api/databases/${database}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newDbName }),
      });
      if (response.ok) {
        alert(localization.databaseCloned(newDbName));
        handleClose();
      } else {
        const error = await response.json();
        alert(`${localization.failedToCloneDatabase}: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to clone database:', error);
      alert(`${localization.failedToCloneDatabase}: ${error}`);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <ModalDialog
      buttons={
        <>
          <button
            className={`${primaryButtonClassName} flex items-center gap-2`}
            type="button"
            onClick={handleClose}
            disabled={isCloning}
          >
            {localization.cancel}
          </button>
          <button
            className={`${successButtonClassName} flex items-center gap-2`}
            type="button"
            onClick={handleClone}
            disabled={isCloning || !prefix.trim()}
          >
            {isCloning ? localization.cloningDatabase : localization.cloneDatabase}
          </button>
        </>
      }
      title={localization.cloneDatabaseDialogTitle}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="clone-prefix">{localization.cloneDatabaseDialogMessage(database)}</label>
        <input
          id="clone-prefix"
          type="text"
          className="border rounded p-2"
          value={prefix}
          onChange={e => setPrefix(e.target.value)}
          placeholder={localization.cloneDatabasePrefixPlaceholder}
          disabled={isCloning}
        />
      </div>
    </ModalDialog>
  );
}
