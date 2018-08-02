import { delay } from 'redux-saga';
import { put, takeEvery, all, call, take } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';

function createContractEventChannel({contract, eventName, eventOptions}) {
    const name = contract.contractName
  
    return eventChannel(emit => {
      const eventListener = contract.events[eventName](eventOptions).on('data', event => {
        emit({type: 'EVENT_FIRED', name, event})
      })
      .on('changed', event => {
        emit({type: 'EVENT_CHANGED', name, event})
      })
      .on('error', error => {
        emit({type: 'EVENT_ERROR', name, error})
        emit(END)
      })
  
      const unsubscribe = () => {
        eventListener.removeListener(eventName)
      }
  
      return unsubscribe
    })
  }
  
  function* callListenForContractEvent({contract, eventName, eventOptions}) {
    const contractEventChannel = yield call(createContractEventChannel, {contract, eventName, eventOptions})
  
    while (true) {
      var event = yield take(contractEventChannel)
      yield put(event)
    }
  }

  function* pledgeSagas() {
    yield takeEvery('LISTEN_FOR_EVENT', callListenForContractEvent)
  }
  
  export default pledgeSagas;
