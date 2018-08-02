import { UPDATE_PLEDGE } from "./constants";

function pledgeReducer(state = {
    expiresAt: null,
}, action) {
    switch(action.type) {
        case UPDATE_PLEDGE:
            return {
                ...state,
                [action.payload.key]: action.payload.value,
            };
        default:
            return state;
    }
}

export default pledgeReducer;
