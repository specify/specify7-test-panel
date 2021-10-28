import { Action, generateReducer } from 'typesafe-reducer';
import { Deployment } from '../lib/deployment';
import { States } from '../stateReducers/Dashboard';

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
