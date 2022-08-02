import React from 'react';

export function Centered({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="mb-10 flex flex-grow items-center justify-center">
      <div className="mx-5 max-w-2xl gap-x-5 sm:flex">{children}</div>
    </div>
  );
}

export const unpaddedContentClassName =
  'flex-1 container mx-auto max-w-screen-lg gap-10';
export const contentClassName = `${unpaddedContentClassName} p-4`;
