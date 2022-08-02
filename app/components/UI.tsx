import React from 'react';

export function Centered({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return <div className="flex items-center justify-center flex-grow mb-10">
    <div className="sm:flex gap-x-5 max-w-2xl mx-5">{children}</div>
  </div>
}

export const unpaddedContentClassName =
  'flex-1 container mx-auto max-w-screen-lg gap-10';
export const contentClassName = `${unpaddedContentClassName} p-4`;
