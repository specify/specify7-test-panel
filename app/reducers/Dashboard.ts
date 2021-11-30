import { Action, generateReducer, State } from 'typesafe-reducer';
import { DeploymentWithInfo } from '../lib/deployment';
import { RA } from '../lib/typescriptCommonTypes';

type MainState = State<'MainState', { deployment: RA<DeploymentWithInfo> }>;

export type States = MainState;

type DestroyInstanceAction = Action<
  'DestroyInstanceAction',
  {
    id: number;
  }
>;

type AddInstanceAction = Action<
  'AddInstanceAction',
  {
    deployment: DeploymentWithInfo;
  }
>;

type ChangeConfigurationAction = Action<
  'ChangeConfigurationAction',
  {
    id: number;
    newState: DeploymentWithInfo;
  }
>;

export type Actions =
  | DestroyInstanceAction
  | AddInstanceAction
  | ChangeConfigurationAction;

export const reducer = generateReducer<States, Actions>({
  DestroyInstanceAction: ({ state, action }) => ({
    ...state,
    deployment: state.deployment.filter((_, index) => index !== action.id),
  }),
  AddInstanceAction: ({ state, action }) => ({
    ...state,
    deployment: [...state.deployment, action.deployment],
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
