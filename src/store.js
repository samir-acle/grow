import { generateContractsInitialState } from 'drizzle';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './rootSaga';
import { createStore, applyMiddleware, compose } from 'redux';
import reducer from './reducer';
import Pressure from 'Contracts/Pressure.json';

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const drizzleOptions = {
  contracts: [
      Pressure,
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
