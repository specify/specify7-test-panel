import type { DiskSpace } from 'check-disk-space';
import Link from 'next/link';
import React from 'react';

import Layout from '../../components/Layout';
import { useApi } from '../../components/useApi';
import { useDatabases } from '../index';
import { localization } from '../../const/localization';
import { generateDatabaseNameWithDate } from '../../lib/databaseNameHelper';

export default function Index(): JSX.Element {
  const databases = useDatabases();
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [databaseName, setDatabaseName] = React.useState<string>('');
  const [fileSize, setFileSize] = React.useState<number | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0); // 0-100
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const formRef = React.useRef<HTMLFormElement>(null);

  const [diskUsage] = useApi<DiskSpace>('/api/disk-usage');

  const isConflict =
    typeof databases === 'object' &&
    Boolean(databaseName) &&
    databases.some(({ name }) => name === generateDatabaseNameWithDate(databaseName));

  return (
    <Layout title={localization.uploadNewDatabase} protected>
      <div className="flex flex-1 flex-col gap-5">
        <Link href="/databases/" className="text-blue-500 hover:underline">
          {localization.goBack}
        </Link>
        {(() => {
          if (typeof diskUsage === 'undefined') return localization.loading;
          if (typeof diskUsage === 'string') return diskUsage;
          const used = diskUsage.data.size - diskUsage.data.free;
          const usedGB = Math.round((used / 1024 / 1024 / 1024) * 10) / 10;
          const totalGB = Math.round((diskUsage.data.size / 1024 / 1024 / 1024) * 10) / 10;
          const percent = ((used / diskUsage.data.size) * 100).toFixed(2);
          return `${localization.diskUsage} ${usedGB}/${totalGB} GB (${percent}% used)`;
        })()}
        <h1 className="text-5xl">{localization.pageTitle}</h1>
        {isUploading ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl">{localization.uploading}</h2>
            <div className="w-full h-2 bg-gray-200 rounded overflow-hidden max-w-xl">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">{uploadProgress}%</div>
            {uploadError && (
              <div className="text-red-500 text-sm">{uploadError}</div>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-2xl">{localization.uploadNewDatabase}</h2>
            <div>
              <form
                className="inline-flex flex-col gap-y-5"
                encType="multipart/form-data"
                method="post"
                ref={formRef}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsUploading(true);
                  setUploadProgress(0);
                  setUploadError(null);
                  const form = formRef.current;
                  if (!form) return;
                  const formData = new FormData(form);
                  const xhr = new window.XMLHttpRequest();
                  xhr.open('POST', '/api/databases/upload', true);
                  xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                      const percent = Math.round((event.loaded / event.total) * 100);
                      setUploadProgress(percent);
                    }
                  };
                  xhr.onload = () => {
                    if (xhr.status === 302) {
                      setUploadProgress(100);
                      window.location.href = '/databases/';
                    } else if (xhr.status >= 400) {
                      setIsUploading(false);
                      setUploadError(xhr.responseText || 'Upload failed');
                    }
                  };
                  xhr.onerror = () => {
                    setIsUploading(false);
                    setUploadError('Network error');
                  };
                  xhr.send(formData);
                }}
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
                        fileName.split('.').slice(0, -1).join('.') || fileName;
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
                  {localization.databaseName}
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
                diskUsage.data.free + fileSize >= diskUsage.data.size * 0.99 ? (
                  <p>{localization.notEnoughSpace}</p>
                ) : undefined}
                {databaseName && (
                  <div className="flex flex-col gap-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      {localization.finalDatabaseName}
                    </label>
                    <div className="rounded bg-gray-100 p-2 font-mono text-sm">
                      {generateDatabaseNameWithDate(databaseName)}
                    </div>
                  </div>
                )}
                <input
                  className={`cursor-pointer rounded-xl bg-green-500 p-3
                    hover:bg-green-800`}
                  type="submit"
                  disabled={isConflict}
                  value={localization.upload}
                />
                {isConflict && <p>{localization.nameConflict}</p>}
              </form>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
