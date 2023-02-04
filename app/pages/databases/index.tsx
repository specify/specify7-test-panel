import Link from 'next/link';
import React from 'react';

import FilterUsers from '../../components/FilterUsers';
import {
  dangerButtonClassName,
  infoButtonClassName,
  primaryButtonClassName,
  successButtonClassName,
} from '../../components/InteractivePrimitives';
import Layout from '../../components/Layout';
import { Loading, ModalDialog } from '../../components/ModalDialog';
import { fetchApi, useApi } from '../../components/useApi';
import commonStrings from '../../const/commonStrings';
import siteInfo from '../../const/siteInfo';
import type { Language, LocalizationStrings } from '../../lib/languages';
import type { IR, RA } from '../../lib/typescriptCommonTypes';
import { Database, useDatabases } from '../index';
import { multiSortFunction } from '../../lib/helpers';
import { Deployment } from '../../lib/deployment';

export const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly errorOccurred: string;
  readonly listUsers: string;
  readonly download: string;
  readonly uploadNew: string;
  readonly usersOfDatabase: (database: string) => string;
  readonly deleteDialogTitle: string;
  readonly deleteDialogMessage: (database: string) => string;
  readonly corruptDatabase: string;
  readonly makeSuperUser: string;
  readonly calculateSizes: string;
  readonly mb: string;
}> = {
  'en-US': {
    title: 'Databases',
    errorOccurred: 'Unexpected error occurred',
    listUsers: 'List users',
    download: 'Download',
    uploadNew: 'Upload New',
    usersOfDatabase: (database) => `Specify Users in ${database}`,
    deleteDialogTitle: 'Delete Database?',
    deleteDialogMessage: (database) =>
      `Are you sure you want to delete ${database} database?`,
    corruptDatabase: 'corrupt database',
    makeSuperUser: 'Make super user',
    calculateSizes: 'Calculate sizes',
    mb: 'mb',
  },
};

type DatabaseWithSize = Database & { readonly size?: string | undefined };

export default function Index(): JSX.Element {
  const rawDatabases = useDatabases();
  const [listUsers, setListUsers] = React.useState<string | undefined>(
    undefined
  );

  const [state] = useApi<RA<Deployment>>('/api/state');
  const usedDatabases = React.useMemo(
    () =>
      typeof state === 'object'
        ? new Set(state.data.map(({ database }) => database))
        : new Set(),
    [state]
  );

  const [deleteDatabase, setDeleteDatabase] = React.useState<
    string | undefined
  >(undefined);

  const [showSizes, setShowSizes] = React.useState(false);
  const [sizes, setSizes] = React.useState<
    { readonly data: IR<number> } | string | undefined
  >(undefined);
  const databases = React.useMemo<
    RA<DatabaseWithSize> | string | undefined
  >(() => {
    if (typeof sizes !== 'object' || typeof rawDatabases !== 'object')
      return rawDatabases;
    const indexed = Object.fromEntries(
      rawDatabases.map(({ name, version }) => [name, version])
    );
    return Object.entries(sizes.data)
      .sort(multiSortFunction(([_name, size]) => size, true))
      .map(([name, size]) => ({
        name,
        size,
        version: indexed[name],
      }));
  }, [sizes, rawDatabases]);

  return (
    <Layout
      localizationStrings={localizationStrings}
      title={localizationStrings}
    >
      {(languageStrings, language): JSX.Element => (
        <FilterUsers protected>
          {typeof databases === 'undefined' ? (
            <Loading />
          ) : typeof databases === 'string' ? (
            <ModalDialog title={languageStrings.title}>{databases}</ModalDialog>
          ) : typeof sizes === 'number' ? (
            <ModalDialog title={languageStrings.title}>{sizes}</ModalDialog>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-5">
                <Link href="/" className="text-blue-500 hover:underline">
                  {commonStrings[language].goBack}
                </Link>
                <h1 className="text-5xl">{siteInfo[language].title}</h1>
                <h2 className="text-2xl">{languageStrings.title}</h2>
                <ul className="flex w-8/12 flex-col gap-y-5">
                  {databases.map(({ name, version, size }) => (
                    <li
                      className="flex flex-row gap-x-5 rounded bg-gray-300 p-5"
                      key={name}
                    >
                      <span className="flex-1">
                        {name}
                        <b> ({version ?? languageStrings.corruptDatabase})</b>
                        {typeof size === 'number' && (
                          <b>{` (${size} ${languageStrings.mb})`}</b>
                        )}
                      </span>
                      {!usedDatabases.has(name) && (
                        <a
                          className="text-red-400 hover:underline"
                          href={`/api/databases/${name}/drop`}
                          onClick={(event): void => {
                            event.preventDefault();
                            setDeleteDatabase(name);
                          }}
                        >
                          {commonStrings[language].delete}
                        </a>
                      )}
                      <a
                        className="text-green-400 hover:underline"
                        href={`/api/databases/${name}/export`}
                      >
                        {languageStrings.download}
                      </a>
                      <button
                        className="text-blue-400 hover:underline"
                        type="button"
                        onClick={(): void => setListUsers(name)}
                      >
                        {languageStrings.listUsers}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/databases/upload"
                  className={successButtonClassName}
                >
                  {languageStrings.uploadNew}
                </Link>
                <button
                  className={infoButtonClassName}
                  onClick={(): void => {
                    setShowSizes(true);
                    fetchApi('/api/databases/size')
                      .then(setSizes)
                      .catch(console.error);
                  }}
                  disabled={showSizes}
                >
                  {showSizes && sizes === undefined
                    ? commonStrings[language].loading
                    : languageStrings.calculateSizes}
                </button>
              </div>
              {typeof listUsers === 'string' && (
                <ListUsers
                  database={listUsers}
                  language={language}
                  onClose={() => setListUsers(undefined)}
                />
              )}
              {typeof deleteDatabase === 'string' && (
                <DeleteDatabase
                  database={deleteDatabase}
                  language={language}
                  onClose={() => setDeleteDatabase(undefined)}
                />
              )}
            </>
          )}
        </FilterUsers>
      )}
    </Layout>
  );
}

function ListUsers({
  database,
  language,
  onClose: handleClose,
}: {
  readonly database: string;
  readonly language: Language;
  readonly onClose: () => void;
}) {
  const users = useApi<IR<string>>(`/api/databases/${database}/users`)[0];
  const languageStrings = localizationStrings[language];

  return typeof users === 'undefined' ? (
    <Loading />
  ) : (
    <ModalDialog
      title={languageStrings.usersOfDatabase(database)}
      onClose={handleClose}
    >
      {typeof users === 'string' ? (
        users
      ) : (
        <ul className="flex flex-col gap-y-3">
          {Object.entries(users.data).map(([id, name]) => (
            <li className="flex gap-x-1" key={id}>
              <span>{name}</span>
              <button
                className="text-blue-400 hover:underline"
                type="button"
                onClick={(): void =>
                  void fetch(
                    `/api/databases/${database}/user/${id}/make-admin`,
                    {
                      method: 'POST',
                    }
                  )
                    .then(handleClose)
                    .catch(console.error)
                }
              >
                {languageStrings.makeSuperUser}
              </button>
            </li>
          ))}
        </ul>
      )}
    </ModalDialog>
  );
}

function DeleteDatabase({
  database,
  language,
  onClose: handleClose,
}: {
  readonly database: string;
  readonly language: Language;
  readonly onClose: () => void;
}) {
  const languageStrings = localizationStrings[language];

  return (
    <ModalDialog
      buttons={
        <>
          <button
            className={primaryButtonClassName}
            type="button"
            onClick={handleClose}
          >
            {commonStrings[language].cancel}
          </button>
          <a
            className={dangerButtonClassName}
            href={`/api/databases/${database}/drop`}
          >
            {commonStrings[language].delete}
          </a>
        </>
      }
      title={languageStrings.deleteDialogTitle}
      onClose={handleClose}
    >
      {languageStrings.deleteDialogMessage(database)}
    </ModalDialog>
  );
}
