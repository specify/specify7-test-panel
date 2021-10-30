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
import { contentClassName } from '../../components/UI';
import { useApi } from '../../components/useApi';
import commonStrings from '../../const/commonStrings';
import siteInfo from '../../const/siteInfo';
import type { Language, LocalizationStrings } from '../../lib/languages';
import { RA } from '../../lib/typescriptCommonTypes';

export const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly errorOccurred: string;
  readonly listUsers: string;
  readonly download: string;
  readonly uploadNew: string;
  readonly usersOfDatabase: (database: string) => string;
  readonly deleteDialogTitle: string;
  readonly deleteDialogMessage: (database: string) => string;
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
  },
};

export default function Index(): JSX.Element {
  const databaseList = useApi<RA<string>>('/api/databases');
  const [listUsers, setListUsers] = React.useState<string | undefined>(
    undefined
  );

  const [deleteDatabase, setDeleteDatabase] = React.useState<
    string | undefined
  >(undefined);

  return (
    <Layout
      title={localizationStrings}
      localizationStrings={localizationStrings}
    >
      {(languageStrings, language): JSX.Element => (
        <FilterUsers protected>
          <main className={`${contentClassName} flex flex-col`}>
            {typeof databaseList === 'undefined' ? (
              <Loading />
            ) : typeof databaseList === 'string' ? (
              <ModalDialog title={languageStrings['title']}>
                {databaseList}
              </ModalDialog>
            ) : (
              <>
                <div className="flex flex-col flex-1 gap-5">
                  <Link href="/">
                    <a className="hover:underline text-blue-500">
                      {commonStrings[language].goBack}
                    </a>
                  </Link>
                  <h1 className="text-5xl">{siteInfo[language].title}</h1>
                  <h2 className="text-2xl">{languageStrings.title}</h2>
                  <ul className="gap-y-5 flex flex-col w-8/12">
                    {databaseList.data.map((database) => (
                      <li
                        key={database}
                        className="gap-x-5 flex flex-row p-5 bg-gray-500 rounded"
                      >
                        <span className="flex-1">{database}</span>
                        <a
                          className="hover:underline text-green-400"
                          href={`/api/databases/${database}/export`}
                        >
                          {languageStrings.download}
                        </a>
                        <button
                          type="button"
                          className="hover:underline text-blue-400"
                          onClick={() => setListUsers(database)}
                        >
                          {languageStrings.listUsers}
                        </button>
                        <a
                          className="hover:underline text-red-400"
                          href={`/api/databases/${database}/drop`}
                          onClick={(event) => {
                            event.preventDefault();
                            setDeleteDatabase(database);
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
          </main>
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
  const users = useApi<RA<string>>(`/databases/${database}/users`);
  const languageStrings = localizationStrings[language];

  return typeof users === 'undefined' ? (
    <Loading />
  ) : (
    <ModalDialog
      title={languageStrings.usersOfDatabase(database)}
      onCloseClick={handleClose}
    >
      {typeof users === 'string' ? (
        users
      ) : (
        <ul>
          {users.data.map((user) => (
            <li key={user}>{user}</li>
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
      title={languageStrings.deleteDialogTitle}
      onCloseClick={handleClose}
      buttons={
        <>
          <button
            type="button"
            className={primaryButtonClassName}
            onClick={handleClose}
          >
            {commonStrings[language].cancel}
          </button>
          <a
            href={`/api/databases/${database}/drop`}
            className={dangerButtonClassName}
          >
            {commonStrings[language].delete}
          </a>
        </>
      }
    >
      {languageStrings.deleteDialogMessage(database)}
    </ModalDialog>
  );
}
