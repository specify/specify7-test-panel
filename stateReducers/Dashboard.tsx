import { generateReducer, State } from 'typesafe-reducer';
import { Deployment } from '../lib/deployment';
import { RA } from '../lib/typescriptCommonTypes';

type MainState = State<'MainState', { deployment: RA<Deployment> }>;

export type States = MainState;

export const stateReducer = generateReducer<JSX.Element, States>({
  MainState({ action: state }) {
    return <pre>{JSON.stringify(state)}</pre>;
  },
});
