import React from "react";
import { DrizzleProvider } from 'drizzle-react';
import App from './App';
import store, { drizzleOptions } from './store';
import { Grommet } from 'grommet';

class Root extends React.Component {
  render() {
      return (
        <Grommet full={true}>
          <DrizzleProvider options={drizzleOptions} store={store} >
              <App />
          </DrizzleProvider>
        </Grommet>
      )
  }
}

export default Root;
