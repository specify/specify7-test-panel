import { organization } from '../const/siteConfig';
import { queryGithubApi } from './github';
import type { IR, RA } from './typescriptCommonTypes';

export type User = {
  readonly token: string;
  readonly name: string;
  readonly login: string;
  readonly organization: {
    readonly teams: IR<RA<string>>;
  };
};

export const getUserInfo = async (token: string): Promise<User> =>
  queryGithubApi(
    token,
    `{
  organization(login: "${organization}") {
    teams(first: 40) {
      nodes {
        name
        members(first: 40) {
          nodes {
            login
          }
        }
      }
    }
  }
  viewer {
    name
    login
  }
}`
  ).then(
    (response: {
      readonly data: {
        readonly organization: {
          readonly teams: {
            readonly nodes: RA<{
              readonly name: string;
              readonly members: {
                readonly nodes: RA<{
                  readonly login: string;
                }>;
              };
            }>;
          };
        };
        readonly viewer: {
          readonly name: string;
          readonly login: string;
        };
      };
    }) => {
      const teams = Object.fromEntries(
        response.data.organization.teams.nodes.map(({ name, members }) => [
          name,
          members.nodes.map(({ login }) => login),
        ])
      );

      if (Object.keys(teams).length === 0)
        throw new Error('Sorry, you are not authorized to access this page');
      return {
        token,
        name: response.data.viewer.name,
        login: response.data.viewer.login,
        organization: {
          teams,
        },
      };
    }
  );

export const getUserTokenCookie = (cookies: string): string | undefined =>
  cookies
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];
