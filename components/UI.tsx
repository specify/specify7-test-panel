import React from 'react';

export const Centered = ({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element => (
  <main className="flex items-center justify-center flex-grow mb-10">
    <div className="sm:flex gap-x-5 max-w-2xl mx-5">{children}</div>
  </main>
);

export const unpaddedContentClassName = 'container mx-auto max-w-screen-lg';
export const contentClassName = `${unpaddedContentClassName} mb-10 p-4`;
