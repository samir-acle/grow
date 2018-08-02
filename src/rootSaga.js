import 'regenerator-runtime/runtime';

import { all, fork } from 'redux-saga/effects';
import { drizzleSagas } from 'drizzle';
import pledgeSagas from './Pledge/sagas';

export default function* root() {
  yield all([
    drizzleSagas.map(saga => fork(saga)),
    pledgeSagas(),
  ])
}
