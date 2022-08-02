import React from 'react';

import type { StatusLineStatus } from '../lib/statusLineConfig';
import {
  DEFAULT_STATUS_LINE_TIMEOUT,
  STATUS_LINE_ANIMATION_DURATION,
} from '../lib/statusLineConfig';

export const StatusLineContext = React.createContext<
  (status: Readonly<StatusLineStatus>) => void
>(() => {
  throw new Error('Not Defined');
});
StatusLineContext.displayName = 'StatusLineContext';

export function StatusLineProvider({
  durationOfVisibility = DEFAULT_STATUS_LINE_TIMEOUT,
  children,
}: {
  readonly durationOfVisibility?: number;
  readonly children: Readonly<JSX.Element>;
}): JSX.Element {
  const [configuration, setConfiguration] = React.useState<
    StatusLineStatus | undefined
  >(undefined);

  // eslint-disable-next-line functional/prefer-readonly-type
  const updateStack = React.useRef<StatusLineStatus[]>([]);
  const lastMessage = React.useRef<StatusLineStatus['message'] | undefined>(
    undefined
  );
  const timeOutId = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  if (typeof configuration?.message !== 'undefined')
    lastMessage.current = configuration.message;

  function updateStatus(): void {
    timeOutId.current =
      updateStack.current.length > 0
        ? setTimeout(() => {
            updateStack.current.shift();
            setConfiguration(undefined);
            setTimeout(updateStatus, STATUS_LINE_ANIMATION_DURATION);
          }, durationOfVisibility + STATUS_LINE_ANIMATION_DURATION)
        : undefined;
    setConfiguration(updateStack.current[0]);
  }

  function addStatus(status: Readonly<StatusLineStatus>): void {
    if (
      status.id !== '' &&
      updateStack.current.some(
        ({ id }: { readonly id: string }) => id === status.id
      )
    )
      return;
    updateStack.current.push(status);
    if (typeof timeOutId.current === 'undefined') updateStatus();
  }

  return (
    <StatusLineContext.Provider value={addStatus}>
      {children}
      <div
        className={`pointer-events-none absolute inset-0 h-screen w-screen
        overflow-hidden ${
          typeof lastMessage.current === 'undefined' ? 'hidden' : ''
        }`}
      >
        <div
          className={`pointer-events-auto absolute bottom-0 left-0
          w-screen transform text-xl transition-none
          duration-100 motion-safe:transition-transform ${
            typeof configuration === 'undefined'
              ? 'translate-y-full'
              : 'translate-y-0'
          }`}
        >
          {lastMessage.current}
        </div>
      </div>
    </StatusLineContext.Provider>
  );
}
