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

type Actions =
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
    deployment: Array.from(state.deployment).splice(
      action.id,
      1,
      action.newState
    ),
  }),
});
