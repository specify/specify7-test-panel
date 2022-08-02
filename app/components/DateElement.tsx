import React from 'react';

import {
  getRelativeDate,
  longDateFormatter,
} from '../lib/internationalization';

export function DateElement({
  date,
  fallback = undefined,
  // If true, display full date by default and relative date as a tooltip
  flipDates = false,
}: {
  readonly date: number | string | undefined;
  readonly fallback?: React.ReactNode;
  readonly flipDates?: boolean;
}): JSX.Element {
  if (
    (typeof date !== 'string' && typeof date !== 'number') ||
    Number.isNaN(new Date(date))
  )
    return <>{fallback}</>;
  const dateObject = new Date(date);
  const relativeDate = getRelativeDate(dateObject);
  const fullDate = longDateFormatter.format(dateObject);
  const [children, title] = flipDates
    ? [fullDate, relativeDate]
    : [relativeDate, fullDate];
  return (
    <time dateTime={dateObject.toISOString()} title={title}>
      {children}
    </time>
  );
}
