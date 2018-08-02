import React from "react";
import { DrizzleProvider } from 'drizzle-react';
import App from './App';
import store, { drizzleOptions } from './store';

class Root extends React.Component {
  render() {
      return (
          <DrizzleProvider options={drizzleOptions} store={store} >
              <App />
          </DrizzleProvider>
      )
  }
}

export default Root;
