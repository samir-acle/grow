import React, { Component } from 'react';
import ContractStateRetriever from '../ContractStateRetriever';
import { drizzleConnect } from 'drizzle-react';

const ProofAssignments = (props) => {
    const { id } = props.match.params;

    return (
        <ContractStateRetriever contract="Grow" method="addressToAssignedProofs" args={[this.props.accounts[0]]} render={({ contractData }) => (
            <Box>
                {contractData.map(p => <div>{p}</div>)}
                {/* verify proof screen will need proof details on right side maybe and then proof picture displayed on left side */}
            </Box>
        )}/>
    )
}

const mapDispatchToProps = dispatch => {
    return {
        
    }
};

const mapStateToProps = state => {
    return {
        accounts: state.accounts,
    };
};

export default drizzleConnect(ProofAssignments, mapStateToProps, mapDispatchToProps);
