import type { Action, State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import type { DeploymentWithInfo } from '../lib/deployment';
import type { RA } from '../lib/typescriptCommonTypes';

type MainState = State<
  'MainState',
  { readonly deployment: RA<DeploymentWithInfo> }
>;

export type States = MainState;

type DestroyInstanceAction = Action<
  'DestroyInstanceAction',
  {
    readonly id: number;
  }
>;

type AddInstanceAction = Action<
  'AddInstanceAction',
  {
    readonly deployment: DeploymentWithInfo;
  }
>;

type RemoveInstanceAction = Action<
  'RemoveInstanceAction',
  {
    readonly id: number;
  }
>;

type ChangeConfigurationAction = Action<
  'ChangeConfigurationAction',
  {
    readonly id: number;
    readonly newState: DeploymentWithInfo;
  }
>;

export type Actions =
  | AddInstanceAction
  | RemoveInstanceAction
  | ChangeConfigurationAction
  | DestroyInstanceAction;

export const reducer = generateReducer<States, Actions>({
  DestroyInstanceAction: ({ state, action }) => ({
    ...state,
    deployment: state.deployment.filter((_, index) => index !== action.id),
  }),
  AddInstanceAction: ({ state, action }) => ({
    ...state,
    deployment: [...state.deployment, action.deployment],
  }),
  RemoveInstanceAction: ({ state, action }) => ({
    ...state,
    deployment: [
      ...state.deployment.slice(0, action.id),
      ...state.deployment.slice(action.id + 1),
    ],
  }),
  ChangeConfigurationAction: ({ state, action }) => ({
    ...state,
    deployment: [
      ...state.deployment.slice(0, action.id),
      {
        ...action.newState,
        wasAutoDeployed: false,
      },
      ...state.deployment.slice(action.id + 1),
    ],
  }),
});
