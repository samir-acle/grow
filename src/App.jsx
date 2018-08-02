import React, { Component } from "react";
import { drizzleConnect } from "drizzle-react";
import { Box, Grid, Button } from 'grommet';

import NewPledge from "./Pledge/NewPledge";
import Pledges from "./Pledge/Pledges";

import { BrowserRouter as Router, Link, Route } from 'react-router-dom';

class App extends Component {
  render() {
    const { drizzleStatus, accounts } = this.props;

    if (drizzleStatus.initialized) {
      return (
        <Router>
          <div className="App">
            {/* check grid availability */}
            {/* <Grid
              areas={[
                { name: 'nav', start: [0, 0], end: [0, 1] },
                { name: 'active', start: [1, 0], end: [2, 0] },
                { name: 'history', start: [1, 1], end: [2, 1] },
              ]}
              columns={['small', 'flex']}
              rows={['small', 'medium']}
              gap='small'
            > */}
              {/* <Box grideArea='nav' background='brand'> */}
                <Link to='/pledges'>View Pledges</Link>
                <Link to='/pledges/new'>Create Pledge</Link>
              {/* </Box> */}

              {/* <Box grideArea='active' background='accent-3'> */}
                <Route exact={true} path="/pledges" component={Pledges} />
                <Route path="/pledges/new" component={NewPledge} />
              {/* </Box> */}

              {/* <Box grideArea='history' background='accent-1' /> */}
            {/* </Grid> */}

            {/* <header className="App-header">
              <h1 className="App-title">Social Pressure</h1>
              <h3>Create Pledge</h3>
            </header>
            <div className="App-intro">
              <Pledge />
            </div> */}

          </div>
        </Router>
      );
    }

    return <div>Loading dapp...</div>;
  }
}

const mapStateToProps = state => {
  return {
    accounts: state.accounts,
    drizzleStatus: state.drizzleStatus,
  };
};

const AppContainer = drizzleConnect(App, mapStateToProps);
export default AppContainer;
