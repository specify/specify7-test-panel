import { useRouter } from 'next/router';
import React from 'react';

import { getUserTokenCookie } from '../lib/user';

const defaultRedirectLocations = {
  protected: '/sign-in',
  notProtected: '/',
} as const;

export default function FilterUsers<
  IS_PROTECTED extends true | undefined = undefined
>({
  protected: pageIsProtected = undefined,
  redirectPath,
  children,
}: {
  readonly protected?: IS_PROTECTED;
  readonly redirectPath?: string;
  readonly children: JSX.Element;
}): JSX.Element | null {
  const router = useRouter();

  const isProtected = typeof pageIsProtected === 'boolean' && pageIsProtected;

  const resolvedRedirectPath =
    redirectPath ??
    defaultRedirectLocations[isProtected ? 'protected' : 'notProtected'];

  const [isSignedIn, setIsSignedIn] = React.useState<boolean | undefined>();

  React.useEffect(() => {
    setIsSignedIn(typeof getUserTokenCookie(document.cookie) !== 'undefined');
  }, [typeof document]);

  if (typeof isSignedIn === 'undefined') return null;
  else if (isSignedIn === isProtected)
    return typeof children === 'undefined' ? <></> : children;
  else {
    void router.push(resolvedRedirectPath);
    return null;
  }
}
