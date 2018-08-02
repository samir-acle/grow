import { UPDATE_PLEDGE, CREATE_PLEDGE } from "./constants";

export const updatePledge = (payload, options) => ({
    type: UPDATE_PLEDGE,
    payload,
    ...options,
});

export const createPledge = (payload, options) => ({
    type: CREATE_PLEDGE,
    payload,
    ...options,
});

export const listenForEvent = (contract, eventName, eventOptions) => ({
    type: 'LISTEN_FOR_EVENT',
    contract,
    eventName,
    eventOptions,
});

export const storeDataKey = (payload, options) => ({
    type: 'STORE_DATA_KEY',
    payload,
    ...options,
});

// TODO - clean this up - should I make it clear what payload is expected?
