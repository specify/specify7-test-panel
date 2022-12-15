import Link from 'next/link';
import React from 'react';

import FilterUsers from '../../components/FilterUsers';
import {
  dangerButtonClassName,
  primaryButtonClassName,
  successButtonClassName,
} from '../../components/InteractivePrimitives';
import Layout from '../../components/Layout';
import { Loading, ModalDialog } from '../../components/ModalDialog';
import { useApi } from '../../components/useApi';
import commonStrings from '../../const/commonStrings';
import siteInfo from '../../const/siteInfo';
import type { Language, LocalizationStrings } from '../../lib/languages';
import type { IR } from '../../lib/typescriptCommonTypes';
import { useDatabases } from '../index';

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
  },
};

export default function Index(): JSX.Element {
  const databases = useDatabases();
  const [listUsers, setListUsers] = React.useState<string | undefined>(
    undefined
  );

  const [deleteDatabase, setDeleteDatabase] = React.useState<
    string | undefined
  >(undefined);

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
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-5">
                <Link href="/">
                  <a className="text-blue-500 hover:underline">
                    {commonStrings[language].goBack}
                  </a>
                </Link>
                <h1 className="text-5xl">{siteInfo[language].title}</h1>
                <h2 className="text-2xl">{languageStrings.title}</h2>
                <ul className="flex w-8/12 flex-col gap-y-5">
                  {databases.map(({ name, version }) => (
                    <li
                      className="flex flex-row gap-x-5 rounded bg-gray-300 p-5"
                      key={name}
                    >
                      <span className="flex-1">
                        {name}
                        <b> ({version ?? languageStrings.corruptDatabase})</b>
                      </span>
                      <a
                        className="text-green-400 hover:underline"
                        href={`/api/databases/${name}/export`}
                      >
                        {languageStrings.download}
                      </a>
                      <button
                        className="text-blue-400 hover:underline"
                        type="button"
                        onClick={() => setListUsers(name)}
                      >
                        {languageStrings.listUsers}
                      </button>
                      <a
                        className="text-red-400 hover:underline"
                        href={`/api/databases/${name}/drop`}
                        onClick={(event) => {
                          event.preventDefault();
                          setDeleteDatabase(name);
                        }}
                      >
                        {commonStrings[language].delete}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Link href="/databases/upload">
                  <a className={successButtonClassName}>
                    {languageStrings.uploadNew}
                  </a>
                </Link>
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
