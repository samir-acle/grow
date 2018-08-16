import React, { Component } from 'react';
import MultipleContractStateRetriever from '../MultipleContractStateRetriever';
import { Link } from 'react-router-dom';
import { Box, Text } from 'grommet';

const ProofState = {
    '0': {
        display: 'Pending',
        status: 'unknown',
    },
    '1': {
        display: 'Subitted',
        status: 'warning'
    },
    '2': {
        display: 'Accepted',
        status: 'ok',
    },
    '3': {
        display: 'Rejected',
        status: 'error'
    },
    '4': {
        display: 'Expired',
        status: 'critical'
    },
};

class Proofs extends Component {

    constructor(props) {
        super(props);
    }

    render() {

        return (
            <MultipleContractStateRetriever contract="Grow" method="getProof" args={this.props.proofIds} render={({ contractData, args }) => (
                <Box>
                    {contractData.map((cd, i) => <Proof {...cd} proofId={args[i]} />)}
                </Box>
            )} />
        )
        // button to create new proof
    }
}

class Proof extends Component {

    render() {
        return (
            <Box background={`status-${ProofState[this.props.state].status}`}>
                {ProofState[this.props.state].display === 'Pending' && <Link to={`/proofs/${this.props.proofId}/submit`}>Submit Proof</Link>}
                <Text>{ProofState[this.props.state].display}</Text>
            </Box>
        )
    }
}

export default Proofs;


// have proofIds from pledge

// pledges should be styled based on state

// expire button?  - need to figure this out, before you can submit?
