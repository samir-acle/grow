import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import _ from 'lodash';
import MultipleContractStateRetriever from '../MultipleContractStateRetriever';
import { Link } from 'react-router-dom';
import { Box, Text, Button, Heading } from 'grommet';
import { ProofState, activeProofStates, PENDING } from '../constants';
import Proof from './Proof';

const isPendingProof = (proofData) => {
    return ProofState[proofData.state].display === PENDING;
};

const isNonPendingProof = (proofData) => {
    return ProofState[proofData.state].display !== PENDING;
};

const NextPendingProof = ({ proofs }) => {
    const pendingProof = _.chain(proofs)
        .filter(isPendingProof)
        .head()
        .value();

    return (
        <Box>
            <Heading level="4">{`${pendingProof ? 'Next Pending Proof' : 'No Pending Proofs'}`}</Heading>
            {pendingProof && <Proof key={pendingProof.proofId} {...pendingProof} />}
        </Box>
    )
};

const NonPendingProofs = ({ proofs }) => {
    return (
        <Box direction="column">
            <Heading level="4">Proofs</Heading>
            <Box direction="row" wrap="row">
                {_.chain(proofs)
                    .filter(isNonPendingProof)
                    .map((p) => <Proof key={p.proofId} {...p} />)
                    .value()}
            </Box>
        </Box>
    )
};

class Proofs extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <MultipleContractStateRetriever contract="Grow" method="getProof" args={this.props.proofIds} render={({ contractData, args }) => (
                <Box direction="row" justify="between" pad="medium">
                    <NextPendingProof proofs={contractData.map((p,i) => ({ ...p, proofId: args[i] }))} />
                    <NonPendingProofs proofs={contractData.map((p,i) => ({ ...p, proofId: args[i] }))} />
                </Box>
            )} />
        )
    }
}

export default Proofs;
