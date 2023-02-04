import type { DiskSpace } from 'check-disk-space';
import Link from 'next/link';
import React from 'react';

import Layout from '../../components/Layout';
import { useApi } from '../../components/useApi';
import commonStrings from '../../const/commonStrings';
import siteInfo from '../../const/siteInfo';
import type { LocalizationStrings } from '../../lib/languages';
import { useDatabases } from '../index';

export const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly errorOccurred: string;
  readonly databaseName: string;
  readonly upload: string;
  readonly uploading: string;
  readonly diskUsage: string;
  readonly notEnoughSpace: string;
  readonly mb: string;
  readonly nameConflict: string;
}> = {
  'en-US': {
    title: 'Upload new database',
    errorOccurred: 'Unexpected error occurred',
    databaseName: 'Database Name',
    upload: 'Upload',
    uploading: 'Uploading',
    diskUsage: 'Disk Usage:',
    notEnoughSpace:
      'Warning: there may be not enough space on the server to upload this file',
    mb: 'MB',
    nameConflict:
      'Database with this name already exists. Please delete it first',
  },
};

const bytesToMb = (size: number): number =>
  Math.round((size / 1024 / 1024) * 100) / 100;

export default function Index(): JSX.Element {
  const databases = useDatabases();
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [databaseName, setDatabaseName] = React.useState<string>('');
  const [fileSize, setFileSize] = React.useState<number | undefined>(undefined);

  const formRef = React.useRef<HTMLFormElement>(null);

  const [diskUsage] = useApi<DiskSpace>('/api/disk-usage');

  const isConflict =
    typeof databases === 'object' &&
    databases.some(({ name }) => name === databaseName);

  return (
    <Layout
      localizationStrings={localizationStrings}
      title={localizationStrings}
    >
      {(languageStrings, language): JSX.Element => (
        <div className="flex flex-1 flex-col gap-5">
          <Link href="/databases/">
            <a className="text-blue-500 hover:underline">
              {commonStrings[language].goBack}
            </a>
          </Link>
          {`${languageStrings.diskUsage} ${
            typeof diskUsage === 'undefined'
              ? commonStrings[language].loading
              : typeof diskUsage === 'string'
              ? diskUsage
              : `${bytesToMb(diskUsage.data.free)}/${bytesToMb(
                  diskUsage.data.size
                )}${languageStrings.mb}`
          }`}
          <h1 className="text-5xl">{siteInfo[language].title}</h1>
          {isUploading ? (
            <h2 className="text-2xl">{languageStrings.uploading}</h2>
          ) : (
            <>
              <h2 className="text-2xl">{languageStrings.title}</h2>
              <div>
                <form
                  action="/api/databases/upload"
                  className="inline-flex flex-col gap-y-5"
                  encType="multipart/form-data"
                  method="post"
                  ref={formRef}
                  onSubmit={() => setTimeout(() => setIsUploading(true), 200)}
                >
                  <input
                    accept=".sql,.gz,.tgz,.zip,.bz2,.tar,.xz"
                    name="file"
                    required
                    type="file"
                    onChange={({ target }): void => {
                      const file = target.files?.[0];
                      if (typeof file !== 'undefined' && databaseName === '') {
                        const fileName = file.name;
                        const withoutExtension =
                          fileName.split('.').slice(0, -1).join('.') ||
                          fileName;
                        const stripInvalid = withoutExtension.replaceAll(
                          /\W+/g,
                          '_'
                        );
                        setDatabaseName(stripInvalid);
                        setFileSize(file.size);
                      }
                    }}
                  />
                  <label className="flex flex-col gap-y-2">
                    {languageStrings.databaseName}
                    <input
                      className="rounded p-2"
                      name="databaseName"
                      pattern="[a-zA-Z0-9_]+"
                      required
                      type="text"
                      value={databaseName}
                      onChange={({ target }) => setDatabaseName(target.value)}
                    />
                  </label>
                  {typeof diskUsage === 'object' &&
                  typeof fileSize === 'object' &&
                  diskUsage.data.free + fileSize >=
                    diskUsage.data.size * 0.99 ? (
                    <p>{languageStrings.notEnoughSpace}</p>
                  ) : undefined}
                  <input
                    className={`cursor-pointer rounded-xl bg-green-500 p-3
                    hover:bg-green-800`}
                    type="submit"
                    disabled={isConflict}
                    value={languageStrings.upload}
                  />
                  {isConflict && <p>{languageStrings.nameConflict}</p>}
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
