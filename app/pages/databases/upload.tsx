import Link from 'next/link';
import React from 'react';

import Layout from '../../components/Layout';
import commonStrings from '../../const/commonStrings';
import siteInfo from '../../const/siteInfo';
import type { LocalizationStrings } from '../../lib/languages';

export const localizationStrings: LocalizationStrings<{
  readonly title: string;
  readonly errorOccurred: string;
  readonly databaseName: string;
  readonly upload: string;
  readonly uploading: string;
}> = {
  'en-US': {
    title: 'Upload new database',
    errorOccurred: 'Unexpected error occurred',
    databaseName: 'Database Name',
    upload: 'Upload',
    uploading: 'Uploading',
  },
};

export default function Index(): JSX.Element {
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [databaseName, setDatabaseName] = React.useState<string>('');

  const formRef = React.useRef<HTMLFormElement>(null);

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
                  onSubmit={() => {
                    setTimeout(() => setIsUploading(true), 200);
                  }}
                >
                  <input
                    type="file"
                    required
                    accept=".sql,.gz,.tgz,.zip,.bz2,.tar,.xz"
                    name="file"
                    onChange={({ target }) => {
                      const fileName = target.files?.[0]?.name;
                      if (
                        typeof fileName !== 'undefined' &&
                        databaseName === ''
                      ) {
                        const withoutExtension =
                          fileName.split('.').slice(0, -1).join('.') ||
                          fileName;
                        const stripInvalid = withoutExtension.replaceAll(
                          /[^a-zA-Z0-9_]+/g,
                          '_'
                        );
                        setDatabaseName(stripInvalid);
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
