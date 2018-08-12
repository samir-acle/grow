import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { drizzleConnect } from 'drizzle-react';
import _ from 'lodash';
import { Box } from 'grommet';
import IpfsRetriever from '../IPFS/IpfsRetriever';
import ContractStateRetriever from '../ContractStateRetriever';

export const PledgeDetails = ({ title, what, where, when, why }) => {
    return (
        <Box>
            <h2>Pledge Details</h2>
            <p>Title: {title}</p>
            <p>What: {what}</p>
            <p>Where: {where}</p>
            <p>When: {when}</p>
            <p>Why: {why}</p>
        </Box>
    )
}

class Pledge extends Component {

    constructor(props, context) {
        super(props);
        this.state = {
            pledgeId: context.drizzle.web3.utils.soliditySha3(props.account, props.index),
        };
    }

    render() {
        return (
            <ContractStateRetriever contract="Grow" method="getPledge" args={[this.state.pledgeId]} render={({ contractData }) => (
                <Box>
                    <Box>
                        <p>owner: {contractData.owner}</p>
                        <p>collateral: {contractData.collateral}</p>
                        <p>numOfProofs: {contractData.numOfProofs}</p>
                        <div>proofs: {contractData.proofs.map(id => <p>{id}</p>)}</div>
                    </Box>

                    <IpfsRetriever hash={contractData.metadataHash} render={({ data }) => (
                        <PledgeDetails {...data} />
                    )} />
                </Box>
            )}/>
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
        contract: state.contracts.Grow,
    };
};

export default drizzleConnect(Pledge, mapStateToProps, mapDispatchToProps);
