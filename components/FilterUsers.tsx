import { useRouter } from 'next/router';
import React from 'react';

import { User, UserContext } from './UserContext';
import { Loading } from './ModalDialog';

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
  readonly children?: (props: {
    readonly user: IS_PROTECTED extends true ? User : null;
  }) => React.ReactNode;
}): JSX.Element {
  const router = useRouter();
  const { user } = React.useContext(UserContext);

  const isProtected = typeof pageIsProtected === 'boolean' && pageIsProtected;

  const resolvedRedirectPath =
    redirectPath ??
    defaultRedirectLocations[isProtected ? 'protected' : 'notProtected'];

  if (user === 'loading') return <Loading />;
  else if (Boolean(user) === isProtected)
    return typeof children === 'undefined' ? (
      <React.Fragment />
    ) : (
      <>
        {children({
          user: user as unknown as IS_PROTECTED extends true ? User : null,
        })}
      </>
    );
  else {
    void router.push(resolvedRedirectPath);
    return <Loading />;
  }
}
