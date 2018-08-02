import { combineReducers } from 'redux';
import { drizzleReducers } from 'drizzle';
import PledgeReducer from './Pledge/reducer';
import ProfileReducer from './Profile/ProfileReducer';

const reducer = combineReducers({
  ...drizzleReducers,
  profile: ProfileReducer,
  pledge: PledgeReducer,
});

export default reducer;
