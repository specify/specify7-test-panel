import { useRouter } from 'next/router';
import React from 'react';

import { getUserTokenCookie } from '../lib/user';

const defaultRedirectLocations = {
  protected: '/sign-in',
  notProtected: '/',
} as const;

export default function FilterUsers({
  protected: isProtected = true,
  redirectPath,
  children,
}: {
  readonly protected?: boolean;
  readonly redirectPath?: string;
  readonly children: React.ReactNode;
}): JSX.Element | null {
  const router = useRouter();

  const resolvedRedirectPath =
    redirectPath ??
    defaultRedirectLocations[isProtected ? 'protected' : 'notProtected'];

  const [isSignedIn, setIsSignedIn] = React.useState<boolean | undefined>();

  React.useEffect(
    () =>
      setIsSignedIn(typeof getUserTokenCookie(document.cookie) !== 'undefined'),
    []
  );

  if (typeof isSignedIn === 'undefined') return null;
  else if (isSignedIn === isProtected) return <>{children}</>;
  else {
    router.push(resolvedRedirectPath).catch(console.error);
    return null;
  }
}
