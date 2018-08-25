import { generateContractsInitialState } from 'drizzle';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './rootSaga';
import { createStore, applyMiddleware, compose } from 'redux';
import reducer from './reducer';
import Grow from 'Contracts/Grow.json';
import GrowToken from 'Contracts/GrowToken.json';
import Staking from 'Contracts/Staking.json';

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const drizzleOptions = {
  contracts: [
      Grow,
      GrowToken,
      Staking,
  ]
};

const initialState = {
  contracts: generateContractsInitialState(drizzleOptions),
};

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(
    applyMiddleware(
      sagaMiddleware
    )
  )
);

sagaMiddleware.run(rootSaga);

export default store;
