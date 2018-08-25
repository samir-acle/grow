import React, { Component } from "react";
import { drizzleConnect } from "drizzle-react";
import { Box, Grid, Button } from 'grommet';

import NewPledge from "./Pledge/NewPledge";
import Pledges from "./Pledge/Pledges";
// import Pledges2 from "../Pledges2";
import { PledgeView } from "./Pledge/Pledge";
import NewProofContainer from "./Proof/NewProofContainer";
import TokenContainer from "./Staking/TokenContainer";
import Review from "./ProofReview/ProofAssignments";
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';

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
              <Box background='brand'>
                {/* Placeholder for logo */}
                <Link to='/pledges'>Pledge</Link>
                <Link to='/review'>Review</Link>
                <Link to='/tokens'>Staking</Link>
              </Box>

              <Box background='accent-3'>
                <Route path="/pledges" component={Pledges} />
                <Route path="/review" component={Review} />
                <Route path="/tokens" component={TokenContainer} />
              </Box>

              {/* TODO - consistantyl use render props? */}
              <Box>
                <Switch>
                  <Route exact={true} path="/pledges/new" component={NewPledge} />
                  <Route exact={true} path="/pledges/:id" render={props => <PledgeView key={props.match.params.id} {...props} />} />
                  <Route path="/proofs/:proofId/submit" render={props => <NewProofContainer key={props.match.params.proofId} proofId={props.match.params.proofId} {...props} />} />
                </Switch>
              </Box>

                {/* <Route path="/proofs/:id" component={ProofView} /> */}
                {/* <Route path="/proofs/submit" component={NewProof} /> */}
                {/* <Link to='/pledges/new'>Create Pledge</Link>
                <Link to='/proofs'>View Proofs</Link>
                <Link to='/proofs/submit'>Submit Proof</Link> */}



              <Box grideArea='history' background='accent-1' />
            {/* </Grid> */}
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
