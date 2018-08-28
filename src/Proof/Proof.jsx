import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import MultipleContractStateRetriever from '../MultipleContractStateRetriever';
import { Link } from 'react-router-dom';
import { Box, Text, Button, Stack } from 'grommet';
import { ProofState, activeProofStates, PENDING } from '../constants';

const isExpired = (timestampInSeconds) => {
    return Date.now() > (timestampInSeconds * 1000);
};

const isActiveProof = (state) => {
    return activeProofStates.includes(state);
};

const ProofStateDisplay = ({ state }) => {
    return (
        <Box>
            <Text>State: {state.display}</Text>
        </Box>
    )
};

const ProofExpirationButton = ({ state, proofId, drizzle }) => {
    return (
        <React.Fragment>
            {isActiveProof(state) && <Button
                onClick={() => drizzle.contracts.Grow.methods.expireProof.cacheSend(proofId)}
                label="Expire Proof"
                color="status-error"
            />}
        </React.Fragment>
    )
}

const ProofSubmitButton = ({ state, proofId, router }) => {
    return (
        <React.Fragment>
            {ProofState[state].display === PENDING && <Button
                onClick={() => router.history.push(`/proofs/${proofId}/submit`)}
                label="Submit Proof"
                color="status-ok"
            />}
        </React.Fragment>
    )
}

const ProofActionButton = ({ state, proofId, drizzle, router, isExpired }) => {
    return (
        <React.Fragment>
            {isExpired && <ProofExpirationButton state={state} proofId={proofId} drizzle={drizzle} />}
            {!isExpired && <ProofSubmitButton state={state} proofId={proofId} router={router} />}
        </React.Fragment>
    )
}

const Proof = ({ state, proofId, expiresAt }, context) => {
    const proofIsExpired = isExpired(expiresAt);

    return (
        <Stack anchor="bottom-right">
            <Box round="small" pad="medium" background={`status-${proofIsExpired ? 'critical' : ProofState[state].status}`} gap="small">
                {!proofIsExpired && <Text>Expires At: {moment(expiresAt * 1000).format('YYYY-MM-DD h:MM A')}</Text>}
                {!proofIsExpired && <ProofStateDisplay state={ProofState[state]} />}
                <ProofActionButton isExpired={proofIsExpired} state={state} proofId={proofId} {...context} />
            </Box>
        </Stack>
    )
};

Proof.contextTypes = {
    drizzle: PropTypes.object,
    drizzleStore: PropTypes.object,
    router: PropTypes.shape({
        history: PropTypes.object.isRequired,
    }),
};

export default Proof;
