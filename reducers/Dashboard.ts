import { Action, generateReducer, State } from 'typesafe-reducer';
import { Deployment } from '../lib/deployment';
import { RA } from '../lib/typescriptCommonTypes';

type MainState = State<'MainState', { deployment: RA<Deployment> }>;

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
    deployment: Deployment;
  }
>;

type ChangeConfigurationAction = Action<
  'ChangeConfigurationAction',
  {
    id: number;
    newState: Deployment;
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
      action.newState,
      ...state.deployment.slice(action.id + 1),
    ],
  }),
});
