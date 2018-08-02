function profileReducer(state = {
    numPledges: 0,
}, action) {
    switch(action.type) {
        case 'STORE_DATA_KEY':
            return {
                ...state,
                [action.payload.method]: action.payload.dataKey,
            };
        default:
            return state;
    }
}

export default profileReducer;
