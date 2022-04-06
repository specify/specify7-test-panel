import Link from 'next/link';
import React from 'react';

import Layout from '../../components/Layout';
import commonStrings from '../../const/commonStrings';
import siteInfo from '../../const/siteInfo';
import type { LocalizationStrings } from '../../lib/languages';
import { useApi } from '../../components/useApi';
import type { DiskSpace } from 'check-disk-space';

export const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly errorOccurred: string;
  readonly databaseName: string;
  readonly upload: string;
  readonly uploading: string;
  readonly diskUsage: string;
  readonly notEnoughSpace: string;
  readonly mb: string;
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
  },
};

const bytesToMb = (size: number): number =>
  Math.round((size / 1024 / 1024) * 100) / 100;

export default function Index(): JSX.Element {
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [databaseName, setDatabaseName] = React.useState<string>('');
  const [fileSize, setFileSize] = React.useState<number | undefined>(undefined);

  const formRef = React.useRef<HTMLFormElement>(null);

  const [diskUsage] = useApi<DiskSpace>('/api/disk-usage');

  return (
    <Layout
      title={localizationStrings}
      localizationStrings={localizationStrings}
    >
      {(languageStrings, language): JSX.Element => (
        <div className="flex flex-col flex-1 gap-5">
          <Link href="/databases/">
            <a className="hover:underline text-blue-500">
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
                  method="post"
                  action="/api/databases/upload"
                  encType="multipart/form-data"
                  ref={formRef}
                  className="gap-y-5 inline-flex flex-col"
                  onSubmit={() => setTimeout(() => setIsUploading(true), 200)}
                >
                  <input
                    type="file"
                    required
                    accept=".sql,.gz,.tgz,.zip,.bz2,.tar,.xz"
                    name="file"
                    onChange={({ target }) => {
                      const file = target.files?.[0];
                      if (typeof file !== 'undefined' && databaseName === '') {
                        const fileName = file.name;
                        const withoutExtension =
                          fileName.split('.').slice(0, -1).join('.') ||
                          fileName;
                        const stripInvalid = withoutExtension.replaceAll(
                          /[^a-zA-Z0-9_]+/g,
                          '_'
                        );
                        setDatabaseName(stripInvalid);
                        setFileSize(file.size);
                      }
                    }}
                  />
                  <label className="gap-y-2 flex flex-col">
                    {languageStrings.databaseName}
                    <input
                      type="text"
                      name="databaseName"
                      className="p-2 rounded"
                      pattern="[a-zA-Z0-9_]+"
                      required
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
                    type="submit"
                    value={languageStrings.upload}
                    className={`hover:bg-green-800 rounded-xl p-3 bg-green-500
                    cursor-pointer`}
                  />
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
