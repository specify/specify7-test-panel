/* eslint-disable @typescript-eslint/no-magic-numbers */
export const MILLISECONDS = 1000;
const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK;
const YEAR = 12 * MONTH;

/* eslint-enable @typescript-eslint/no-magic-numbers */
const relativeDate = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
  style: 'long',
});

export function getRelativeDate(date: Readonly<Date>): string {
  const timePassed = Math.round((Date.now() - date.getTime()) / MILLISECONDS);
  if (timePassed < 0) {
    /*
     * This happens due to time zone conversion issues.
     * Need to fix that issue on the back-end first.
     * See: https://github.com/specify/specify7/issues/641
     * Adding support for future dates is not hard, but it would be weird to
     * create a data set and see its date of creation be 5 hours into the
     * future
     */
    // Throw new Error('Future dates are not supported');
    console.error('Future dates are not supported');
    return relativeDate.format(0, 'second');
  } else if (timePassed <= MINUTE)
    return relativeDate.format(-Math.round(timePassed / SECOND), 'second');
  else if (timePassed <= HOUR)
    return relativeDate.format(-Math.round(timePassed / MINUTE), 'minute');
  else if (timePassed <= DAY)
    return relativeDate.format(-Math.round(timePassed / HOUR), 'hour');
  else if (timePassed <= WEEK)
    return relativeDate.format(-Math.round(timePassed / DAY), 'day');
  else if (timePassed <= MONTH)
    return relativeDate.format(-Math.round(timePassed / WEEK), 'week');
  else if (timePassed <= YEAR)
    return relativeDate.format(-Math.round(timePassed / MONTH), 'month');
  else return relativeDate.format(-Math.round(timePassed / YEAR), 'year');
}
