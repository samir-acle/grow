import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';
import { storeDataKey } from './actions';
import Pledge from './Pledge';

class Pledges extends Component {

    constructor(props, context) {
        super(props);
        this.contract = context.drizzle.contracts.Pressure;

        // should this be instance var?  is this antipattern?
        this.dataKey = this.contract.methods.userAddressToNumberOfPledges.cacheCall(props.accounts[0]);
    }

    componentDidMount() {
        this.props.storeDataKey({ method: 'numberOfPledges', dataKey: this.dataKey });
    }

    render() {
        // make sure this reloads
        const transactionResponse = this.props.contracts.Pressure.userAddressToNumberOfPledges[this.props.numberOfPledgesKey];
        const numberOfPledges = transactionResponse && transactionResponse.value;

        const pledges = [];

        // todo pass data key into component that takes render prop?

        for( let i = 1; i <= numberOfPledges; i++) {
            pledges.push(<Pledge key={'somethingunique'} account={this.props.accounts[0]} index={i} />);
        }

        return (
            <div>
              <h1>PLEDGES</h1>
              { pledges }
            </div>
        )
    }
}

Pledges.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

const mapDispatchToProps = dispatch => {
    return {
        storeDataKey: (payload) => dispatch(storeDataKey(payload)),
    };
};

const mapStateToProps = state => {
    return {
        accounts: state.accounts,
        numberOfPledgesKey: state.profile.numberOfPledges,
        contracts: state.contracts,
    };
};

export default drizzleConnect(Pledges, mapStateToProps, mapDispatchToProps);
