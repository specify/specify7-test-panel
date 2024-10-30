import Link from 'next/link';
import React from 'react';

import {
  dangerButtonClassName,
  infoButtonClassName,
  primaryButtonClassName,
  successButtonClassName,
} from '../../components/InteractivePrimitives';
import Layout from '../../components/Layout';
import { Loading, ModalDialog } from '../../components/ModalDialog';
import { fetchApi, useApi } from '../../components/useApi';
import type { IR, RA } from '../../lib/typescriptCommonTypes';
import { Database, useDatabases } from '../index';
import { multiSortFunction } from '../../lib/helpers';
import { Deployment } from '../../lib/deployment';
import { localization } from '../../const/localization';

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
    <Layout title={localization.databases} protected>
      {typeof databases === 'undefined' ? (
        <Loading />
      ) : typeof databases === 'string' ? (
        <ModalDialog title={localization.dashboard}>{databases}</ModalDialog>
      ) : typeof sizes === 'number' ? (
        <ModalDialog title={localization.dashboard}>{sizes}</ModalDialog>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-5">
            <Link href="/" className="text-blue-500 hover:underline">
              {localization.goBack}
            </Link>
            <h1 className="text-5xl">{localization.pageTitle}</h1>
            <h2 className="text-2xl">{localization.dashboard}</h2>
            <ul className="flex w-8/12 flex-col gap-y-5">
              {databases.map(({ name, version, size }) => (
                <li
                  className="flex flex-row gap-x-5 rounded bg-gray-300 p-5"
                  key={name}
                >
                  <span className="flex-1">
                    {name}
                    <b> ({version ?? localization.corruptDatabase})</b>
                    {typeof size === 'number' && (
                      <b>{` (${size} ${localization.mb})`}</b>
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
                      {localization.delete}
                    </a>
                  )}
                  <a
                    className="text-green-400 hover:underline"
                    href={`/api/databases/${name}/export`}
                  >
                    {localization.download}
                  </a>
                  <a
                    className="text-orange-400 hover:underline"
                    href={`/api/databases/${name}/clone`}
                  >
                    {localization.clone}
                  </a>
                  <button
                    className="text-blue-400 hover:underline"
                    type="button"
                    onClick={(): void => setListUsers(name)}
                  >
                    {localization.listUsers}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <Link href="/databases/upload" className={successButtonClassName}>
              {localization.uploadNew}
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
                ? localization.loading
                : localization.calculateSizes}
            </button>
          </div>
          {typeof listUsers === 'string' && (
            <ListUsers
              database={listUsers}
              onClose={(): void => setListUsers(undefined)}
            />
          )}
          {typeof deleteDatabase === 'string' && (
            <DeleteDatabase
              database={deleteDatabase}
              onClose={(): void => setDeleteDatabase(undefined)}
            />
          )}
        </>
      )}
    </Layout>
  );
}

export function ListUsers({
  database,
  onClose: handleClose,
}: {
  readonly database: string;
  readonly onClose: () => void;
}) {
  const users = useApi<IR<string>>(`/api/databases/${database}/users`)[0];

  return typeof users === 'undefined' ? (
    <Loading />
  ) : (
    <ModalDialog
      title={localization.usersOfDatabase(database)}
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
                {localization.makeSuperUser}
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
  onClose: handleClose,
}: {
  readonly database: string;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <ModalDialog
      buttons={
        <>
          <button
            className={primaryButtonClassName}
            type="button"
            onClick={handleClose}
          >
            {localization.cancel}
          </button>
          <a
            className={dangerButtonClassName}
            href={`/api/databases/${database}/drop`}
          >
            {localization.delete}
          </a>
        </>
      }
      title={localization.deleteDialogTitle}
      onClose={handleClose}
    >
      {localization.deleteDialogMessage(database)}
    </ModalDialog>
  );
}
