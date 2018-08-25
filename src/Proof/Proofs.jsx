import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import MultipleContractStateRetriever from '../MultipleContractStateRetriever';
import { Link } from 'react-router-dom';
import { Box, Text, Button } from 'grommet';
import { ProofState, activeProofStates, PENDING } from '../constants';

class Proofs extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        console.log('in proofs');
        return (
            <MultipleContractStateRetriever contract="Grow" method="getProof" args={this.props.proofIds} render={({ contractData, args }) => (
                <Box>
                    {contractData.map((cd, i) => <Proof key={args[i]} {...cd} proofId={args[i]} />)}
                </Box>
            )} />
        )
    }
}

const isExpired = (timestampInSeconds) => {
    return Date.now() > (timestampInSeconds * 1000);
};

const isActiveProof = (state) => {
    return activeProofStates.includes(state);
};

const Proof = ({ state, proofId, expiresAt }, context) => {
    console.log('returning proof', ProofState, proofId, expiresAt);
    return (
        <Box background={`status-${ProofState[state].status}`}>
            {ProofState[state].display === PENDING && <Link to={`/proofs/${proofId}/submit`}>Submit Proof</Link>}
            {isActiveProof(state) && isExpired(expiresAt) && <Button label="Expire Proof" onClick={() => context.drizzle.contracts.Grow.methods.expireProof.cacheSend(proofId)} />}
            {moment(expiresAt * 1000).format('YYYY-MM-DD HH:MM')}
            <Text>{ProofState[state].display}</Text>
        </Box>
    )
};

Proof.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
};

export default Proofs;


// have proofIds from pledge

// pledges should be styled based on state

// expire button?  - need to figure this out, before you can submit?
