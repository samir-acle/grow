import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';
import { storeDataKey } from './actions';


class Pledge extends Component {
    constructor(props, context) {
        super(props);
        this.contract = context.drizzle.contracts.Pressure;

        // should this be instance var?  is this antipattern?
        this.pledgeId = context.drizzle.web3.utils.soliditySha3(props.account, props.index);
        this.dataKey = this.contract.methods.getPledge.cacheCall(this.pledgeId);
    }

    render() {
        const pledge = this.props.contract.getPledge[this.dataKey];

        if (!pledge || !pledge.value) return null;

        return (
            <div>
                <p>owner: {pledge.value.owner}</p>
                <p>collateral: {pledge.value.collateral}</p>
                <p>title: {pledge.value.title}</p>
                <p>expiresAt: {pledge.value.expiresAt}</p>
                <p>detailsHash: {pledge.value.detailsHash}</p>
            </div>
        )
    }
}

Pledge.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

const mapDispatchToProps = dispatch => {
    return {

    };
};

const mapStateToProps = state => {
    return {
        accounts: state.accounts,
        contract: state.contracts.Pressure,
    };
};

export default drizzleConnect(Pledge, mapStateToProps, mapDispatchToProps);
